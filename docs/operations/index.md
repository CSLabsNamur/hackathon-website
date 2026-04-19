---
title: Operations Overview
description: An overview of the operational basics needed to keep the project running in development and CI.
---

# Operations Overview

This page collects the operational basics needed to keep the project running in development and CI.
It is not yet a full deployment runbook, but it should be enough to avoid the most common mistakes.

## CI

The CI pipeline currently is relatively simple, because we don't have a test suite yet. It runs the following steps:

1. install dependencies;
2. lint;
3. typecheck;
4. build.

This way, we can at least catch build-time issues before they make it to production.

## Deployment

The repository includes:

- a main `Dockerfile` for the application runtime;
- a `Dockerfile-prisma` image used for Prisma setup work;
- a `docker-compose.yaml` that wires them together.

### Production

To deploy the platform, we currently use Coolify on our server. It automatically triggers a build on push to the
`deploy` branch.
It uses the `docker-compose.yaml` to build the application and run it.

The environment variables are set in Coolify itself, which is fully managed by the IT Manager. Either you check with
them first, or you ask for an account on Coolify to manage the deployment.

The generation of the Prisma client is done by the `prisma_setup` service.
Migrations are applied as well, and the seeding script is executed.

### Development preview

To showcase the platform to the team, if necessary, we use the "Preview Deployments" feature of Coolify. It
automatically creates a deployment for a pull request, and it destroys it when the PR is closed.

Environment variables are set in Coolify as well, in their own "Preview Deployments Environment Variables" section.

## Things worth double-checking before shipping

- the build completes successfully;
- the application starts without errors;
- **no dependency security issues are present** (check the output of `npm audit` and fix any critical issues before
  shipping);
- every migration of the Prisma schema has been generated;
- environment variables are present and valid on Coolify.
