---
title: Architecture Overview
description: The high-level view of the platform.
---

# Architecture Overview

This project is a single Nuxt 4 application that serves several distinct surfaces:

- the public website, on SSR, meant for marketing and event information;
- the participant dashboard, client-rendered and protected by authentication, meant for participants to manage their
  profile, team and submissions;
- the admin dashboard, client-rendered and protected by authentication and permissions, meant for organizers to manage
  the event.
- the server, which provides the API and handles background tasks.

There is no separate backend repository.
The frontend and backend are developed together, shipped together, and share types and validation schemas from the same
codebase. That is fully intentional.

If you want more information about the rationale behind this architecture, check out the [Nuxt ADR](/adrs/nuxt).

## Big picture

The application runs as one deployable unit with a few important external services around it:

- a Nuxt 4 client application for the public site and both dashboards;
- an embedded Nitro server for API routes and scheduled tasks;
- Supabase;
    - PostgreSQL database accessed through Prisma ORM
    - Authentication
    - Object Storage
- an SMTP server/relay used by Nodemailer;
- ClamAV for antivirus scanning on uploads.

![Architecture-flowchart.png](/diagrams/Architecture-flowchart.png)

The codebase is organized into four main directories, which follows the Nuxt 4 structure:

- `app/` contains pages, layouts, components, composables, middleware and client-side utilities of the frontend.
- `server/` contains the API routes, server-side helpers, background tasks, mail handling, and Prisma code.
- `shared/` contains types, validation schemas, and permission definitions shared between the client and the server.
- `content/` contains the small amount of content managed through Nuxt Content for the public website.
- `docs/` contains this documentation.

## What lives where

If you need to find your way around quickly, this is the mental map to keep in mind:

- Public routes such as `/`, `/infos`, `/partenaires` and `/historique` live under `app/pages/`.
- The participant dashboard lives under `app/pages/participant/`.
- The admin dashboard lives under `app/pages/admin/`.
- The API lives under `server/api/`.
- Database schema, migrations and seed data live under `server/prisma/`.
- Shared validation schemas live under `shared/schemas/`.

## Key flows

### Common request flow

Most interactive flows follow this sequence:

1. A page or component calls a composable such as `useParticipants`, `useRooms`, or `useCurrentAdmin`.
2. The composable uses the shared `$api` client from `app/plugins/api.ts`.
3. The API client automatically adds the bearer token from the Supabase session and the CSRF header.
4. The Nitro route checks the current user and permissions.
5. The route validates the input, usually through a schema from `shared/schemas/`.
6. The route reads or writes data through Prisma and sometimes through Supabase services as well.
7. The response comes back to the client, and the UI updates from there.

### File-uploading flow

File uploading is one of the most involved flows in the project. We will talk about it again in
the [API documentation](/backend/api#validation-patterns).

A typical file upload flow looks like this:

1. The public form submits multipart data.
2. The server receives it and parses the request with Formidable.
3. The uploaded file is checked for type concordance and scanned by ClamAV for viruses.
4. The non-file part of the form is validated with Valibot and a shared schema.
5. The file is renamed in some way to avoid name collisions and security issues.
6. The file is uploaded to Supabase Storage.

### Email delivery

The email pipeline is split in two parts:

- HTML content is generated from MJML templates compiled into TypeScript render functions.
- Email jobs are stored in `EmailOutbox`, then processed by a Nitro scheduled task every 5 minutes.

For detailed explanation, check out the [email documentation](/backend/#email).

## Important architectural choices

### Supabase for auth and storage, Prisma for the domain model

Supabase handles authentication and object storage, and gives us a Postgres database to work with.

Prisma is used for the actual application data model, as the ORM and migration tool.

## Suggested next pages

- [Auth & RBAC](/architecture/auth-rbac)
- [Data Model](/architecture/data-model)
- [Backend Overview](/backend/)
