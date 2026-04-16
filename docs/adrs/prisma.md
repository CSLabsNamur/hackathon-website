---
title: ADR - Prisma
description: Why Prisma is used as the ORM.
---

# Prisma

## Context

The project stores a fairly rich application model. We use complex queries, with a lot of relations to navigate, and we
want to keep the codebase readable and maintainable for future contributors.

We also need a clear schema that is versioned in the repository, clean support for types, a way to handle migrations for
cleaner deployment, and a way to handle transactions across multiple queries when needed.

## Decision

Use Prisma as the object relational mapper (ORM) for the database.

## Why

- The schema is explicit and versioned in the repository.
- The generated client gives type-safe access to the database, shared accross the frontend and backend, with a clear API
  for navigating relationships and handling transactions.
- The Prisma Migrate tool easily handles schema migrations.
- Hand-written SQL requires more discipline to respect security standards.
- Shared understanding improves when the schema is readable in one place.

## Alternatives considered

### Direct SQL everywhere

This would offer maximum control, but the project would lose a lot of readability and consistency for everyday CRUD and
relationship-heavy logic.

This would also require more work and discipline to ensure that queries are secure and that the schema is
well-documented and versioned.

### Treat Supabase as the only data abstraction

Supabase is part of the stack, and we could use its library to access the database, but we'd loose the benefits from a
dedicated application schema and typed access layer.

## Consequences

- More work to set up local environment, because the Prisma client needs to be generated and the migrations need to be
  run before the application can start.
- We need to take Prisma into account when designing Docker images and deployment, to ensure that the client is
  generated, and that the migrations are run correctly.
- Schema changes need client generation and migration discipline.
- The generated client and generated model files must not be edited manually.
