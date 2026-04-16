---
title: ADR - Supabase
description: Why Supabase is used for auth and storage.
---

# Supabase

## Context

We obviously need a database, but we also need object storage. We also need to build an authentication system on top of
this.
Supabase provides all of these things in one package, and can be self-hosted.

## Decision

Use Supabase for authentication and object storage, on top of the main PostgreSQL database.

## Why

- If we use Supabase for the database and the object storage, we might as well use its authentication system as well.
- Supabase Auth gives the project a working sign-in flow without building auth from scratch.
- Supabase Storage is a practical fit for CV uploads, submission files, and event assets.
- The PostgreSQL database remains accessible to Prisma.

## Alternatives considered

### AppWrite

AppWrite is a similar all-in-one backend solution, but it is not as mature as Supabase. The main downside is that its
database is only accessible through the AppWrite library, which would make it impossible to use Prisma.

This would be okay if AppWrite had a migration system, since it can give us shared types as well, but it does not.
I didn't want to deal with maintaining a unique hand-written SQL file for the database schema, and I already had
experience with Prisma, so I ruled it out.

AppWrite still seems like a good option for some simpler projects though, and the library rules out security issues that
can arise from hand-written SQL.

### Build custom authentication in the application

Possible, but difficult to justify for this project.
It would increase security-sensitive code and maintenance work.

## Consequences

- A valid Supabase account is not enough unless there is also a matching "database" user (in table User and Admin XOR
  Participant).
- Self-hosting Supabase is not a trivial task, unfortunately. The IT Manager will need to be involved in the process.
- Local development is slightly heavier because auth, storage and database concerns all need to be configured correctly.
- We're dependent on Supabase for auth methods. For example, they don't have passkeys yet.
