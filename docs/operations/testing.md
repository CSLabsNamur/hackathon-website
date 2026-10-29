---
title: Testing
description: Run and extend the Nuxt test suite.
---

# Testing

The suite uses Vitest projects following the [Nuxt testing guide](https://nuxt.com/docs/4.x/getting-started/testing):

- `test/unit/`: classic unit testing for shared code, without Nuxt auto-imports.
- `test/nuxt/`: Nuxt runtime tests using `@nuxt/test-utils`, which allows to test Nuxt components, plugins, pages, etc.
- `test/integration/`: classic integration testing for code that interacts with the database, Supabase, and the API.

Use `pnpm test` for a single run or `pnpm test:watch` while working to watch for file changes.
This is just vitest behind the scenes, so to test a specific project, you can use `pnpm run test --project nuxt` (or
`unit` / `integration`).

Everything is configured in `vitest.config.ts`.

The rollover tests cover retained versus deleted data, privacy of the archive, stale previews, outstanding deposits,
concurrent requests, full transaction rollback, external cleanup retries, and the UI confirmation gate. Keep future
tests focused on observable behaviour and failure paths.

Shared event values and database setup live in `test/fixtures/`. Each integration test seeds only the data relevant
to its scenario and asserts named records or counts.

## Database tests

Integration tests require `TEST_DATABASE_URL`. They are skipped when it is absent. Use a **disposable** database whose
name ends in `_test`, because **the suite clears its application tables**. Never point this variable at a development or
production database containing data.

For example:

```sh
docker run --detach --rm --name hackathon-tests -e POSTGRES_PASSWORD=test -e POSTGRES_DB=hackathon_test -p 127.0.0.1:55439:5432 postgres:18-alpine
sleep 10 # Wait until PostgreSQL is ready before applying migrations
export TEST_DATABASE_URL=postgresql://postgres:test@127.0.0.1:55439/hackathon_test
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:deploy
pnpm db:generate
pnpm test
docker stop hackathon-tests
```

The integration project sets its `DATABASE_URL` from `TEST_DATABASE_URL` and runs database test files sequentially. The
UI tests never use that database.

When adding end-to-end tests later, add a separate Node project with `@nuxt/test-utils/e2e`; do not combine its helpers
with `@nuxt/test-utils/runtime` in the same test file.
