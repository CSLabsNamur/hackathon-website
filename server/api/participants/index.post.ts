import schema from "#shared/schemas/participants/create";
import * as v from "valibot";
import { randomUUID } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { CautionStatus } from "~~/server/prisma/generated/prisma/enums";
import { generateEpcQrcode, getParticipantCautionReference } from "#shared/utils/participants";
import renderRegistration from "~~/server/mail/generated/registration";

export default defineEventHandler(async (event) => {
  const siteConfig = getSiteConfig(event);
  const editionId = await getCurrentEditionId();
  const settings = await getPublicSettings(event);

  if (!isRegistrationOpen(settings.event.registrationMode, settings.event.registrationsStartDate, settings.event.registrationsEndDate)) {
    throw createError({statusCode: 403, statusMessage: "Les inscriptions sont fermées."});
  }

  // Get the validated body, and extract fields that don't belong to ParticipantCreateInput
  const {
    firstName,
    lastName,
    email,
    turnstileToken,
    cautionAgreement,
    codeOfConduct,
    ...body
  } = await readValidatedBody(event, v.parser(schema));

  if (!await verifyTurnstileToken(turnstileToken, event)) {
    throw createError({statusCode: 400, statusMessage: "Échec de la vérification anti-bot."});
  }

  // Check if the user already exists
  if (await prisma.user.count({where: {email}}) > 0) {
    throw createError({statusCode: 400, statusMessage: "Un utilisateur avec cet email existe déjà."});
  }

  // Prepare the payload for creating the participant
  const participantRole = await prisma.role.findUnique({
    where: {
      key: "participant",
    },
    select: {
      id: true,
    },
  });

  if (!participantRole) {
    throw createError({
      statusCode: 500,
      statusMessage: "Le rôle participant n'est pas configuré.",
    });
  }

  const participantId = createId();
  const createdAuthUserId = randomUUID();
  const cleanupJobIds: string[] = [];
  let registrationEmailJobId: string;
  const supabase = createSupabaseAdminClient();

  try {
    const authCleanup = await prepareSupabaseCreation({type: "AUTH_USER", target: createdAuthUserId});
    cleanupJobIds.push(authCleanup.id);

    const authUser = await supabase.auth.admin.createUser({
      id: createdAuthUserId,
      email,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
      },
    });

    if (authUser.error || !authUser.data.user) {
      throw createError({statusCode: 500, statusMessage: "Erreur lors de la création du compte d'authentification."});
    }

    const paymentIban = settings.event.iban ?? "BEXX XXXX XXXX XXXX";
    const paymentBic = settings.event.bic ?? "XXXXXXXX";
    const paymentReference = getParticipantCautionReference({firstName, lastName});
    const qrcodeUri = await generateEpcQrcode({firstName, lastName}, {
      amount: settings.event.cautionAmount,
      iban: paymentIban,
      bic: paymentBic,
    });
    const html = renderRegistration({
      firstName,
      lastName,
      profileUrl: `${siteConfig.url.replace(/\/$/, "")}/participant/profile`,
      cautionAmount: settings.event.cautionAmount,
      iban: paymentIban,
      bic: paymentBic,
      paymentReference,
      qrcodeUri,
    });

    const emailJob = await withEventTransaction(editionId, async (db) => {
      const currentEvent = await db.eventSettings.findUniqueOrThrow({where: {id: EVENT_SETTINGS_ID}});
      if (!isRegistrationOpen(currentEvent.registrationMode, currentEvent.registrationsStartDate, currentEvent.registrationsEndDate)) {
        throw createError({statusCode: 403, statusMessage: "Les inscriptions sont fermées."});
      }

      await finishSupabaseCreation(db, cleanupJobIds);
      await db.participant.create({
        data: {
          ...body,
          id: participantId,
          user: {
            create: {
              firstName,
              lastName,
              email,
              supabaseAuthId: createdAuthUserId,
              roleAssignments: {
                create: [{
                  role: {
                    connect: {
                      id: participantRole.id,
                    },
                  },
                }],
              },
            },
          },
          caution: CautionStatus.NOT_PAID,
        },
      });

      return enqueueEmail({
        type: "participant_registration",
        recipient: email,
        subject: "Confirmation d'inscription au Hackathon du CSLabs",
        html,
        replyTo: settings.website.contactEmail,
      }, db);
    });
    registrationEmailJobId = emailJob.id;
  } catch (error) {
    await retrySupabaseCleanup(cleanupJobIds).catch((cleanupError) => {
      console.error("Impossible de planifier le nettoyage de l'inscription :", cleanupError);
    });
    event.waitUntil(processSupabaseCleanup(supabase, "GENERAL").catch((cleanupError) => {
      console.error("Erreur lors du nettoyage des données de l'inscription :", cleanupError);
    }));
    throw error;
  }

  let emailWarning: string | undefined;

  try {
    const emailResult = await processEmailOutboxNow(registrationEmailJobId);
    if (emailResult.failed > 0) {
      emailWarning = "Inscription enregistrée, mais l'email de confirmation n'a pas pu être envoyé immédiatement. Nous réessaierons automatiquement dans quelques minutes.";
      console.warn("L'email de confirmation est planifié pour une nouvelle tentative.", {
        emailJobId: registrationEmailJobId,
        email,
      });
    }
  } catch (error) {
    emailWarning = "Inscription enregistrée, mais l'email de confirmation n'a pas pu être envoyé immédiatement. Nous réessaierons automatiquement dans quelques minutes.";
    console.error("Erreur lors de l'envoi immédiat de l'email de confirmation :", error);
  }

  return {
    success: true,
    message: "Inscription enregistrée avec succès.",
    emailWarning,
  };
});
