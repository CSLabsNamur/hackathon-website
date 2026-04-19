---
title: Local Setup
description: A guide to setting up your local development environment for the project.
---

# Local Setup

This guide will walk you through setting up a local development environment for the project using Docker and Supabase.
By the end, you should be able to work on the project locally and test your changes before deploying them onto Coolify.

## Prerequisites

Before you start, make sure you have the following tools available:

- Docker, for Supabase, Maildev and ClamAV
- Node.js 22
- `corepack`, which should be included by default

> [!NOTE]
> Fom Node.js 25 and up, `corepack` will not be included by default.

You can then enable `pnpm` with:

```sh
corepack enable
```

## Install Docker

The instructions are available [here](https://docs.docker.com/get-started/get-docker/).

## Setup Supabase in self-host mode

The full documentation is available [here](https://supabase.com/docs/guides/self-hosting/docker), but here is a summary.

Run the following commands to create a supabase self-host
project ([source](https://supabase.com/docs/guides/self-hosting/docker#installing-supabase)):

```sh
# Get the code
git clone --depth 1 https://github.com/supabase/supabase
# Make your new supabase project directory
mkdir supabase-project
# Tree should look like this
# .
# ├── supabase
# └── supabase-project
# Copy the compose files over to your project
cp -rf supabase/docker/* supabase-project
# Copy the fake env vars
cp supabase/docker/.env.example supabase-project/.env
# Switch to your project directory
cd supabase-project
# Pull the latest images
docker compose pull
```

Generate the keys for the Supabase API using the following
command ([source](https://supabase.com/docs/guides/self-hosting/docker#quick-setup-experimental)):

```sh
sh ./utils/generate-keys.sh
```

Add [maildev](https://github.com/maildev/maildev) to the `docker-compose.yml` in `supabase-project` to have a local SMTP
server for the authentication:

```yml
name: supabase
services:
  # ...
  mail:
    image: maildev/maildev:2.1.0
    environment:
      - MAILDEV_WEB_USER=test
      - MAILDEV_WEB_PASS=test
    ports:
      - "1080:1080"
      - "1025:1025"
volumes:
# ...
```

Uncomment and change the following lines in the `docker-compose.yml` to enable the custom access token hook for
authentication:

```yml
name: supabase
services:
  # ...
  auth:
    # ...
    environment:
      # ...
      GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED: "true"
      GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI: "pg-functions://postgres/public/custom_access_token_hook"
      # ...
    # ...
  # ...
volumes:
# ...
```

Then, you can configure the `.env` in `supabase-project` to change the default passwords, keys and config. Here is
what is should look like at the end:

```sh
# (...)

# Postgres
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# (...)

# Asymmetric key pair (ES256) and opaque API keys
#
# Documentation:
# https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys
#
# To generate:
# sh ./utils/add-new-auth-keys.sh
#
# Opaque API key for client-side use (anon role).
SUPABASE_PUBLISHABLE_KEY=sb_publishable_<your-publishable-key>
# Opaque API key for server-side use (service_role). Never expose in client code.
SUPABASE_SECRET_KEY=sb_secret_<your-secret-key>

# (...)

# Access to Dashboard
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=this_password_is_insecure_and_should_be_updated

# (...)

# Access to Dashboard and REST API
SUPABASE_PUBLIC_URL=http://localhost:8000

# Full external URL of the Auth service, used to construct OAuth callbacks,
# SAML endpoints, and email links
API_EXTERNAL_URL=http://localhost:8000

# (...)

# Using default user (postgres)
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# Default configuration includes Supavisor exposing POSTGRES_PORT
# Postgres uses POSTGRES_PORT inside the container
# Documentation:
# https://supabase.com/docs/guides/self-hosting/docker#accessing-postgres-through-supavisor
POSTGRES_PORT=5432

# (...)

# Unique Supavisor tenant identifier
# Documentation:
# https://supabase.com/docs/guides/self-hosting/docker#accessing-postgres
POOLER_TENANT_ID=your-tenant-id

# (...)

# Equivalent to "Site URL" and "Redirect URLs" platform configuration options
# Documentation: https://supabase.com/docs/guides/auth/redirect-urls
SITE_URL=http://localhost:3000

# (...)

## Email auth (using maildev)
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=mail
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test
SMTP_SENDER_NAME=fake_sender
ENABLE_ANONYMOUS_USERS=false

# (...)
```

You can leave the default passwords/keys for a local setup, but you need to update the SMTP config at the end to match
the `maildev` config in `docker-compose.yml`.

Finally, you can start supabase with the following
command ([source](https://supabase.com/docs/guides/self-hosting/docker#starting-and-stopping)):

```sh
# Start the services (in detached mode)
docker compose up -d
```

## Setup the platform

First, you need to clone the repo:

```sh
git clone https://github.com/CSLabsNamur/hackathon-website.git
cd hackathon-website
```

Then, copy the example `.env` to the right place:

```sh
cp .env.example .env
```

After that, update the `.env` to match the config of Supabase and Maildev. It should look like that:

```sh
# (...)

NUXT_SITE_URL="http://localhost:3000"

# (...)

NUXT_SMTP_HOST="localhost"
NUXT_SMTP_PORT="1025"
NUXT_SMTP_USER="test"
NUXT_SMTP_PASSWORD="test"
NUXT_SMTP_REPLY_TO="event@cslabs.be"

SUPABASE_URL="http://localhost:8000"
SUPABASE_KEY="sb_publishable_<your-publishable-key>"
SUPABASE_SECRET_KEY="sb_secret_<your-secret-key>"
DATABASE_URL="postgresql://postgres.your-tenant-id:your-super-secret-and-long-postgres-password@localhost:5432/postgres"

# (...)
```

Just keep in mind the following 3 things:

- The environment variable `SUPABASE_KEY` corresponds to the environment variable `SUPABASE_PUBLISHABLE_KEY` of
  supabase.
- The environment variable `SUPABASE_SECRET_KEY` corresponds to the environment variable `SUPABASE_SECRET_KEY` of
  supabase.
- The user in the environment variable `DATABASE_URL` is not just the `postgres` role. You also need to add the value of
  your tenant ID from `POOLER_TENANT_ID` in the Supabase config:
  `<role>.<tenant-id>` ([source](https://supabase.com/docs/guides/self-hosting/docker#accessing-postgres-through-supavisor))
  because of the way Supavisor (the pooler) handles authentication and connection pooling.

Next, you need to execute the `supabase_auth_hook.sql` and `supabase_rls.sql` scripts in the Supabase dashboard to
setup the access token hook and the RLS policies. You can do that by going to the SQL editor in the Supabase dashboard
and executing the content of those files.

Finally, you can start the website:

```sh
# In the separate `supabase-project` folder
docker compose up -d

# In this repository
pnpm install
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

`pnpm run db:seed` is important on a fresh database.
It creates the default settings rows, the system roles, and the initial admin profile stored in the application
database. By default, the initial admin profile has the email address `it@cslabs.be`.

If you want to run the application container from this repository's own `docker-compose.yaml` instead, use:

```sh
docker compose up --build
```

This compose file starts the app container and ClamAV.
It does not replace the separate Supabase self-hosted stack.

> [!TIP]
> If you have a heap memory error while building the website, you can try increasing the Node.js heap size:
>
> ```sh
> export NODE_OPTIONS="--max-old-space-size=4096"
> ```

## Creating a user

Participant accounts are created through the registration form.

Organizer accounts are created by sending invites through the admin panel. Don't forget to assign them a fitting role.
Nobody should have permissions that they don't need. We follow the principle of least privilege, so if an organizer
doesn't need to manage the settings, don't give them access to the settings page. You can create custom roles with
custom permissions if needed as well.
