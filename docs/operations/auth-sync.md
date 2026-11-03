---
title: Auth synchronization
description: Recover interrupted Supabase Auth profile updates.
---

# Auth synchronization

Each profile endpoint follows the same explicit sequence:

1. `prepareAuthSync` records recovery before anything changes in Supabase.
2. `updateAuthProfile` sends the new name and email to Supabase.
3. The endpoint's Prisma transaction saves the local profile and calls `finishAuthSync` to remove the job.
4. On failure, `retryAuthSync` makes the job available to the scheduled worker.

If the process stops before finishing, the job remains. The `supabase:sync` Nitro task restores Auth from the
current local `User` row. Recovery restores committed data, it does not apply a previously failed edit.
The task runs every two minutes.

`lockToken` identifies the request or worker handling the job, and `lockedUntil` is its deadline.
Other profile edits are blocked while recovery is outstanding. Deleting a local user also deletes its sync job.

`AuthSyncJob.lastError`, `attempts`, and `scheduledAt` describe pending recovery. Known permanent errors, such as
an email conflict or missing Auth account, set `failed = true` and are logged for intervention. These jobs are
retained, not discarded. After correcting the cause, requeue the affected job:

```sql
UPDATE "AuthSyncJob"
SET "failed"      = false,
    "attempts"    = 0,
    "scheduledAt" = NOW(),
    "updatedAt"   = NOW()
WHERE "userId" = '<local user ID>'
  AND ("lockedUntil" IS NULL OR "lockedUntil" <= NOW());
```

## Account creation

Account creation creates a `SupabaseCleanupJob` before calling Supabase. Its cleanup is deferred for fifteen minutes so
the active request can finish. The goal is to avoid leaving a partially created account if the process crashes. The
cleanup job is removed when the creation request finishes successfully.

If creation fails, cleanup is made immediately eligible for retry. If the process crashes, the existing
`supabase:cleanup` task removes the orphaned Auth account after the deadline.
