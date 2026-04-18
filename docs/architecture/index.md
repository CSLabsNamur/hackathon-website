---
title: Architecture Overview
description: The high-level view of the platform.
---

# Architecture Overview

This project is a single Nuxt 4 application that serves several distinct surfaces:

- the public website;
- the participant dashboard;
- the admin dashboard;
- the server, which provides the API and handles background tasks.

There is no separate backend repository.
The frontend and backend are developed together, shipped together, and share types and validation schemas from the same
codebase. That is fully intentional.

If you want more information about the rationale behind this architecture, check out the [Nuxt ADR](/adrs/nuxt).

## Big picture

The codebase is organized into four main directories, which follows the Nuxt 4 structure:

- `app/` contains pages, layouts, components, composables, middleware and client-side utilities of the frontend.
- `server/` contains the API routes, server-side helpers, background tasks, mail handling, and Prisma code.
- `shared/` contains types, validation schemas, and permission definitions shared between the client and the server.
- `content/` contains the small amount of content managed through Nuxt Content for the public website.

## What lives where

If you need to find your way around quickly, this is the mental map to keep in mind:

- Public routes such as `/`, `/infos`, `/partenaires` and `/historique` live under `app/pages/`.
- The participant dashboard lives under `app/pages/participant/`.
- The admin dashboard lives under `app/pages/admin/`.
- The API lives under `server/api/`.
- Database schema, migrations and seed data live under `server/prisma/`.
- Shared validation schemas live under `shared/schemas/`.

## Important architectural choices

### Supabase for auth and storage, Prisma for the domain model

Supabase handles authentication and object storage, and gives us a Postgres database to work with.

Prisma is used for the actual application data model, as the ORM and migration tool.

## Suggested next pages

- [Auth & RBAC](/architecture/auth-rbac)
- [Data Model](/architecture/data-model)
