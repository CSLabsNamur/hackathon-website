---
title: Operations Overview
description: An overview of the operational basics needed to keep the project running in development and CI.
---

# Operations Overview

This page collects the operational basics needed to keep the project running in development and CI.
It is not yet a full deployment runbook, but it should be enough to avoid the most common mistakes.

## CI

The CI pipeline runs the following steps:

1. install dependencies;
2. lint;
3. typecheck;
4. tests, with a disposable PostgreSQL database for rollover integration tests;
5. build.

This way, we can at least catch build-time issues before they make it to production.

See [Testing](./testing) for the Nuxt/Vitest setup and [Event rollover](./event-rollover) for switching editions.

## Deployment

The repository includes:

- a main `Dockerfile` for the application runtime;
- a `Dockerfile-prisma` image used for Prisma setup work;
- a self-contained `docker-compose.coolify.yaml` for Coolify;
- a `docker-compose.yaml` that inherits those services and adds local settings.

### Local Docker Compose

Copy `.env.example` to `.env`, fill the Supabase and Turnstile values, and set a local
`NUXT_APP_SECRET` using `openssl rand -hex 32`. Then run:

```sh
docker compose up --build
```

The app is available at `http://localhost:3000`, and the Maildev inbox at `http://localhost:1080`.
`APP_PORT` changes the app's host port, but you must also update `NUXT_SITE_URL` to match.
Compose reads `.env` for variable substitution.

Maildev is included in the local Compose file to allow testing email sending without a real SMTP server. It is not used
in production.

### Production

To deploy the platform, we currently use Coolify on our server. It automatically triggers a build on push to the
`deploy` branch.
Set the Docker Compose Location to `/docker-compose.coolify.yaml` with the repository root as Base Directory.
This file declares all three services directly so Coolify can discover their variables and configure the app proxy.
It publishes no host ports, so route the app domain to its internal port `80`. For environment variables, keep
credentials available only at runtime.

The environment variables are set in Coolify itself, which is fully managed by the IT Manager. Either you check with
them first, or you ask for an account on Coolify to manage the deployment.

### Development preview

To showcase the platform to the team, if necessary, we use the "Preview Deployments" feature of Coolify. It
automatically creates a deployment for a pull request, and it destroys it when the PR is closed.

Environment variables are set in Coolify as well, in their own "Preview Deployments Environment Variables" section.
Use separate database/Supabase values for previews and set `NUXT_SITE_ENV=staging`. The generated app URL and signing
secret belong to that deployment's Coolify resource.

## Things worth double-checking before shipping

- the build completes successfully;
- the application starts without errors;
- **no dependency security issues are present** (check the output of `npm audit` and fix any critical issues before
  shipping);
- every migration of the Prisma schema has been generated;
- environment variables are present and valid on Coolify.
