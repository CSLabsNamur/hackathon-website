import prisma from "./prisma";
import { EmailOutboxStatus } from "../prisma/generated/prisma/enums";
import type { Prisma } from "../prisma/generated/prisma/browser";

const EMAIL_OUTBOX_MAX_ATTEMPTS = 5;

type EnqueueEmailInput = Pick<Prisma.EmailOutboxCreateInput, "type" | "recipient" | "subject" | "html" | "replyTo">;

type ProcessEmailOutboxOptions = {
  ids?: string[];
  limit?: number;
};

type ProcessEmailOutboxResult = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
};

/**
 * Calculates the next retry date for an email outbox job based on the number of attempts.
 * Uses an exponential backoff strategy with a maximum delay of 60 minutes.
 *
 * @param attempts The number of attempts that have been made to send the email
 * @return The Date when the next retry should be attempted (Dayjs object)
 */
function getEmailOutboxRetryDate(attempts: number) {
  const now = dayjs();
  const retryDelayMinutes = Math.min(60, 2 ** Math.max(0, attempts - 1));
  return now.add(retryDelayMinutes, "minute");
}

export function enqueueEmail(input: EnqueueEmailInput) {
  return prisma.emailOutbox.create({data: input});
}

/**
 * Processes pending email outbox jobs. If specific IDs are provided, only those jobs will be processed (if they are pending or failed and haven't exceeded max attempts).
 * Otherwise, it will process all pending/failed jobs that are scheduled to be sent at or before the current time and haven't exceeded max attempts.
 *
 * @param options Options to specify which jobs to process and how many to process at once
 * @return An object containing the number of jobs processed, sent, failed, and skipped
 */
export async function processEmailOutbox(options: ProcessEmailOutboxOptions = {}): Promise<ProcessEmailOutboxResult> {
  const now = dayjs();

  // Reset stuck jobs that have been processing for more than 15 minutes and haven't exceeded max attempts.
  await prisma.emailOutbox.updateMany({
    where: {
      status: EmailOutboxStatus.PROCESSING,
      updatedAt: {
        lt: now.subtract(15, "minute").toDate(),
      },
      attempts: {
        lt: EMAIL_OUTBOX_MAX_ATTEMPTS,
      },
    },
    data: {
      status: EmailOutboxStatus.PENDING,
      scheduledAt: now.toDate(),
    },
  });

  const jobs = await prisma.emailOutbox.findMany({
    where: options.ids?.length
      // If specific IDs are provided, only fetch those jobs (if they haven't exceeded max attempts)
      ? {
        id: {
          in: options.ids,
        },
        status: {
          in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.FAILED],
        },
        attempts: {
          lt: EMAIL_OUTBOX_MAX_ATTEMPTS,
        },
      }
      // Otherwise, fetch all pending/failed jobs
      : {
        status: {
          in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.FAILED],
        },
        scheduledAt: {
          lte: now.toDate(),
        },
        attempts: {
          lt: EMAIL_OUTBOX_MAX_ATTEMPTS,
        },
      },
    orderBy: [
      {scheduledAt: "asc"},
      {createdAt: "asc"},
    ],
    take: options.limit ?? 20,
  });

  const {sendMail} = useNodeMailer();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs) {
    const claimed = await prisma.emailOutbox.updateMany({
      // Concurrency control: only claim the job if it is still in the expected state (not modified by another worker)
      where: {
        id: job.id,
        status: job.status,
        updatedAt: job.updatedAt,
      },
      data: {
        status: EmailOutboxStatus.PROCESSING,
        attempts: {
          increment: 1,
        },
        lastError: null,
      },
    });

    if (claimed.count === 0) {
      skipped++;
      continue;
    }

    const attempt = job.attempts + 1;

    try {
      const info = await sendMail({
        to: job.recipient,
        subject: job.subject,
        html: job.html,
        replyTo: job.replyTo ?? undefined,
      });

      if (info.rejected.length > 0) {
        throw new Error(`Email rejected by server: ${info.rejected.join(", ")}`);
      }

      await prisma.emailOutbox.update({
        where: {
          id: job.id,
        },
        data: {
          status: EmailOutboxStatus.SENT,
          sentAt: new Date(),
          lastError: null,
        },
      });
      sent++;
    } catch (error) {
      const exhausted = attempt >= EMAIL_OUTBOX_MAX_ATTEMPTS;

      await prisma.emailOutbox.update({
        where: {id: job.id},
        data: {
          status: exhausted ? EmailOutboxStatus.FAILED : EmailOutboxStatus.PENDING,
          lastError: (error instanceof Error) ? error.message : String(Error),
          scheduledAt: exhausted ? job.scheduledAt : getEmailOutboxRetryDate(attempt).toDate(),
        },
      });
      failed++;
    }
  }

  return {
    processed: jobs.length,
    sent,
    failed,
    skipped,
  };
}

export function processEmailOutboxNow(id: string) {
  return processEmailOutbox({
    ids: [id],
    limit: 1,
  });
}
