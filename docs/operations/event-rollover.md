---
title: Event rollover
description: Archive an edition and prepare the next event.
---

# Event rollover

Open **Paramètres → Éditions et archives**. Reading archives requires `settings.read`; rollover and cleanup both
require the `super_admin` role and `settings.update`. Archives are private to the administration, and they are not added
to the public history page automatically yet.

## Before switching

1. Check if any deposits are still marked as paid. If so, check with the treasurer and the event admin for the reason,
   and process them accordingly.
2. Review the archive preview, especially free-text schedule and sponsor descriptions, to remove leftover participant
   details if any. Logically there shouldn't be any, but we have to be sure for GDPR compliance. Also check if anything
   is missing or broken, and fix it in the active event before proceeding.
3. Enter the next title and event/registration dates. The next event must start in the future
   and after the current event; registration must end no later than its start. Duh.
4. Confirm the content review, type the exact current title in the confirmation dialog, and confirm the rollover.

The preview is then checked again one last time on the server. If its data changed (i.e. another admin found it funny to
edit something while you were working on the rollover), reload and review it before retrying.

You might see a warning about data still being cleaned up. If so, keep an eye on it to make sure it finishes correctly.
If the cleanup is stuck, check the logs of both the application and Supabase.

## What happens to the data

| Data                                                                                                     | Result                                                                                              |
|----------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Event title, slogan, dates, venue, logo                                                                  | Archived                                                                                            |
| Programme and sponsors, including sponsor logos                                                          | Archived and cleared from the active event                                                          |
| Total participants, teams, guests and submissions                                                        | Archived as totals, without identities or demographic breakdowns                                    |
| Participants, participant-only users and role assignments, teams, submissions and requests               | Deleted                                                                                             |
| CVs, submitted files, guest images and participant-only Supabase Auth accounts                           | Queued for deletion in Supabase                                                                     |
| Guests and all email outbox entries, including sent/failed messages                                      | Deleted                                                                                             |
| Rooms, social links, staff accounts/roles/permissions, website settings, venue and payment configuration | Preserved                                                                                           |
| Next event                                                                                               | New edition identity, supplied title/dates, empty slogan/logo, teaser enabled, registrations closed |

Each archive is an independent snapshot. Later edits to the active event do not rewrite it.
Event and sponsor logos remain in their existing storage buckets because the archive references them. We might need to
add a way to clean up old logos in the future, but for now they are preserved. It shouldn't take that much space.

Guest totals include the guest quantities (since a single row can represent multiple guests).
Submission totals include skipped submissions.

## Failure recovery and concurrency

The rollover performs the archive creation, active-data deletion, next-event settings, and the cleanup queue commit in
one PostgreSQL transaction. A database failure rolls them all back. No Supabase deletion happens before that transaction
commits.

The rollover changes settings only if the edition ID still matches. Concurrent rollovers or conflicting database edits
return a conflict.

Registrations, uploads and event creation requests capture the current edition before doing their work. Their save
transaction checks that edition again and updates its revision. If rollover happened meanwhile, the save is rejected
and the upload handler cleans up its new files. The registration transaction also rechecks whether registrations are
still open. Existing-row updates cannot recreate records deleted by rollover.

The mail worker claims a job in an edition-checked transaction before sending. Rollover refuses to proceed while an
email is being sent, no database transaction stays open during SMTP or Supabase calls.

The cleanup queue is processed by a scheduled `supabase:cleanup` task, but the UI sends a request to do it immediately.
The task and the UI use the same queue, so they do not interfere with each other. The task runs every two minutes, and
the UI retries failed jobs every 30 seconds.
The `supabase:cleanup` task retries all remaining jobs every two minutes; the **Reprendre le nettoyage** button retries
immediately. Failed jobs stay in the queue. Deletions are idempotent, including an Auth account that was already removed
by a previous attempt.

## In case of critical failure

If anything fails critically, and the database is left in a failed state, contact the IT Manager immediately. There are
weekly backups of the database and Supabase, and we can restore it to a working state.
Before restoring, check the logs to determine what went wrong.

After restoring, if the cause of the previous crash isn't code-related, you can retry the rollover and hope for the
best.