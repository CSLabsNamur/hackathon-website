---
title: Backend Overview
description: How the server side of the project is structured.
---

# Backend Overview

The backend is the `server/` directory of the Nuxt application.
It runs on Nuxt's embedded [Nitro](https://nitro.build/) server.

## Main directory structure

- `server/api/`: endpoints exposed under `/api/**`
- `server/utils/`: reusable server-side helpers
- `server/tasks/`: cron scheduled tasks
- `server/mail/`: MJML templates and their generated render functions
- `server/prisma/`: schema, migrations, seed, generated client
- `shared/schemas/`: [`Valibot`](https://valibot.dev/) validation schemas shared between client and server
- `shared/utils/`: shared permission and helper logic

## Request lifecycle

Most API routes follow the same pattern:

1. Check authentication and permissions;
2. Get and validate input (e.g. query, body, params);
3. Read or write through Prisma;
4. Call external services if needed;
5. Return a typed JSON response or throw an `H3Error`.

## Validation

Validation is done with Valibot schemas from `shared/schemas/`, shared between the backend and frontend.
The frontend uses them for form validation, and the backend uses them to validate incoming requests.
This keeps the backend and frontend aligned on payload shape.

Form validation is a bit more complex because of multipart parsing. Unfortunately, neither Nitro nor Valibot have
built-in support for multipart forms, so we have to resort to an external library for parsing the form data
([Formidable](https://github.com/node-formidable/formidable)), and then validate the non-file part with Valibot.
It's convoluted as heck, but it's the only I found to validate multipart forms.

If you need to add a multipart form endpoint, check out `server/api/sponsors/index.post.ts` for an example of how to do
it.

## Database access and management

[Prisma](https://www.prisma.io/docs/orm) is the ORM for database access.
The schema, migrations, seed script and generated client all live under `server/prisma/`.
The configuration is at the project root, in `prisma.config.ts`.

You will also find a `seed.ts` script, which you can run with `pnpm run db:seed` to populate the database with initial
data.

### Client generation and usage

Prisma works by generating a type-safe client based on the schema. In later versions, this client has to be generated
within the project sources, so we keep it under git-ignored `server/prisma/generated/`.
To generate the client, run `pnpm run db:generate`, which runs `prisma generate` under the hood.

The generated client is re-exported using a server util, in `server/utils/prisma.ts` to make use of Nitro's autoimports.
If you need to extend the client, add your extension there.

### Migrations and schema management

Prisma has a built-in migration system, which we use to keep the database schema in sync with the Prisma schema.
Those have to be applied to the database with `pnpm run db:deploy`, which runs `prisma migrate deploy` under the hood.

Whenever you make a change to the Prisma schema, you need to generate a migration with `pnpm run db:migrate`, which runs
`prisma migrate dev`.
This will ask you a name for the migration, generate the SQL, and apply it to the database.

## External services

### Supabase

We use [Supabase](https://supabase.com/) for the database, authentication and object storage.

The authentication layer is used for chceking if the request is properly authenticated, while the storage layer is used
for uploaded files and event assets.

### Email

We use [Nodemailer](https://nodemailer.com/) with SMTP for email delivery.

In production, the SMTP server is provided by [SMTP2Go](https://www.smtp2go.com/), while in development, we use
[MailDev](https://github.com/maildev/maildev).

#### Templates

Our templating engine is [MJML](https://mjml.io/), which allows us to write responsive email templates without the usual
nightmares of email HTML.
The MJML files live under `server/mail/templates/`.

Since we also need to render those templates with dynamic data, we use a placeholder library
called [Handlebars](https://handlebarsjs.com/) to inject variables into the templates.
That is why every template has a corresponding type definition `.d.ts` file alongside them, which defines the props that
the template expects.

To assemble it all together, we have a generation script `scripts/generate-mail-templates.ts` that compiles the MJML
templates into render functions, with the proper typing, in `server/mail/generated/`.

If you want to check out an example, check out `server/api/participants/index.post.ts` at the end, where we send a
confirmation email after participant registration.

### Virus scanning

We use [ClamAV](https://www.clamav.net/) for virus scanning on uploads.
The scanning logic is in `server/utils/clamav.ts`, and it's used in every endpoint that accepts file uploads.

A ClamAV instance is included in the Docker Compose setup, and the backend connects to it over TCP.
All of this is configured through environment variables.

If you want an example, check out `server/api/sponsors/index.post.ts`.

## Email outbox

To ensure reliable email delivery, we use an outbox pattern, where emails to be sent are stored in the database, and a
scheduled task processes the outbox and sends the emails, marking them as sent or failed accordingly.
This way, if the email service is down or there is a transient error, we don't lose any emails, and we can retry sending
them later.

## Cron jobs

Nitro scheduled tasks are enabled in `nuxt.config.ts`.
At the moment, the main scheduled job processes the email outbox every 5 minutes.
