---
title: API
description: Conventions and patterns used in the API.
---

# API

This page describes how the API is organized and how new routes should fit into the existing structure.

## File-based routing

The API follows a RESTful structure. Routes live under `server/api/` and map directly to URLs, using Nitro's file-based
routing system.

- `server/api/me.get.ts` -> `GET /api/me`
- `server/api/participants/index.get.ts` -> `GET /api/participants`
- `server/api/participants/me/index.put.ts` -> `PUT /api/participants/me`
- `server/api/roles/[id]/index.delete.ts` -> `DELETE /api/roles/:id`

## API categories in this project

The current API currently falls into these groups:

- current user and auth context: `/api/me`, `/api/admins/me`, `/api/participants/me`
- participant management: `/api/participants/**`
- team management: `/api/teams/**`
- room and schedule management: `/api/rooms/**`, `/api/schedule/**`
- admin and role management: `/api/admins/**`, `/api/roles/**`, `/api/permissions`
- content and operations: `/api/sponsors/**`, `/api/guests/**`, `/api/broadcast`
- settings and exports: `/api/settings`, `/api/admin/settings/**`, `/api/admin/exports/**`
- submissions: `/api/submissions/**`, `/api/submissions/requests/**`

## Common route shape

A typical route handler looks like this:

1. Check authentication and permissions with `requireSignedInUser(...)`, `requirePermission(...)`, or
   `requireOrganizerAccess(...)`;
2. Get and validate input (e.g. query, body, params);
3. Read or write through Prisma;
4. perform one focused unit of work;
5. Return a typed JSON response or throw an `H3Error`.

The route handler will probably call helpers from `server/utils/`, but the control flow should remain easy to read from
top to bottom.

## Authorization patterns

There are three common authorization entry points:

- `requireSignedInUser(event)` when sign-in is enough;
- `requireOrganizerAccess(event)` for broader organizer-only access;
    - This is a coarse check that the user is an organizer, but does not check specific permissions.
- `requirePermission(event, <permission key>)` for permission-protected routes.

Use the most explicit permission check possible.

## Validation patterns

For JSON routes, the preferred pattern is to validate with Valibot and a shared schema.

For multipart routes, the flow is different (more details on why in the [overview](./index.md#validation) page):

- parse with Formidable;
- validate file type and size.
- scan the file(s) with ClamAV;
- validate the non-file part with Valibot and a shared schema;

Because of a bug in the [Nuxt Security](https://nuxt-security.vercel.app/) module, routes using Formidable must disable
the CSRF check. If enabled, this will cause Formidable parser to hang.
To disable this check, you need to set a route config in `nuxt.config.ts`, like this:

```ts
export default defineNuxtConfig({
  // ...
  routeRules: {
    "/api/sponsors/index.post": {
      csurf: false,
    },
  },
});
```

> [!WARNING]
> So please, if you add a new multipart route, don't forget to disable the CSRF check for it.
> I've lost too much time searching why my code wasn't working before.

## Response patterns

The project does not try to wrap every response in a global envelope yet, but it's planned.
Many routes simply return the entity or collection directly.

That said, there are a few practical conventions:

- permission-sensitive routes should include or redact fields depending on the current ability;
    - e.g. the participant list redacts email and other sensitive information for non-admins.
- routes should throw meaningful `statusMessage` values when possible, because the client toast layer displays them.

> [!WARNING]
> So don't throw the entire error. **Be careful of leaking internal details.**
> Instead, throw an error using `createError` with a user-friendly message, and log the full error on the server for
> debugging.

## Things to be careful about

### Sensitive fields

Don't assume that every admin-facing endpoint should automatically include all fields.
Some participant fields are permission-sensitive and the API already distinguishes them.
