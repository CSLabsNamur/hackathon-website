---
title: Environment Setup
description: A guide to setting up the environment variables for the project.
---

# Environment Setup

This guide will walk you through setting up the environment variables for the project.

## Create a `.env` file

During the (local setup guide)[./local-setup.md], you should have copied the `.env.example` file to `.env`.
This file contains all the environment variables needed for the project.

## Update the environment variables

The environment variables are grouped into sections based on their functionality.
We will go through each section and briefly explain what they are for and how to set them up. More detailed explanations
of each section or module will be provided in the respective documentation.

### Nuxt SEO

[Nuxt SEO](https://nuxtseo.com/) is a suite of modules that provides utilities and automatic configuration of
SEO-related features in Nuxt applications.
It gives us modules such as:

- [Nuxt Robots](https://nuxtseo.com/docs/robots): Handles the generation of the `robots.txt` file, which is used to
  control how search engines crawl and index the website;
- [Nuxt Sitemap](https://nuxtseo.com/docs/sitemap): Automatically generates a `sitemap.xml` file, which helps search
  engines understand the structure of the website and find all the pages;
- [Nuxt OG Image](https://nuxtseo.com/docs/og-image): Automatically generates Open Graph images for social media
  sharing;
- [Nuxt Schema-org](https://nuxtseo.com/docs/schema-org): Provides utilities for adding Schema.org structured data to
  the website, which can improve search engine understanding and enhance search results;
- [Nuxt Link Checker](https://nuxtseo.com/docs/link-checker): Checks for broken links in the website and provides
  reports;
- [Nuxt SEO Utils](https://nuxtseo.com/docs/seo-utils): Provides utilities for managing SEO-related data and
  configurations;
- [Nuxt Site Config](https://nuxtseo.com/docs/site-config): Provides a centralized configuration for site-wide SEO
  settings. Automatically installed with any module.

Most of the modules are configured through the `nuxt.config.ts` file, but some of them require environment variables to
be set up, such as Site Config and OG Image.

#### Site Config

The Site Config module provides a centralized configuration for site-wide SEO settings.
It is automatically installed with any module, so you don't need to install it separately.

The environment variables for the Site Config module are:

- `NUXT_SITE_ENV`: The environement the site is running in. This is used to disable indexing for non-production
  environments. It should be set to `production` in production and `development` in development.
  Please note that this is NOT the same as `NODE_ENV`.
- `NUXT_SITE_URL`: The canonical URL of the site. This is used for SEO, OG Images and sitemaps. It should be set to the
  URL of the site in production and `http://localhost:3000` in development.
- `NUXT_SITE_NAME`: The name of the site. This is used for meta tags and other SEO-related features. You should leave it
  as is, i.e. "Le Hackathon du CSLabs".
- `NUXT_SITE_DESCRIPTION`: A description of the site. This is used for meta tags and other SEO-related features. You
  should leave it as is, i.e. "Le Hackathon du CSLabs : 48h pour imaginer, prototyper et présenter un projet tech en
  équipe !".

#### OG Image

The OG Image module automatically generates Open Graph images for social media sharing.

The environment variables for the OG Image module are:

- `NUXT_OG_IMAGE_SECRET`: A secret key used to prevent DoS attacks on the OG image generation endpoint. Use
  `npx nuxt-og-image generate-secret` to generate a random secret key.

### Cloudflare Turnstile

[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) is a CAPTCHA alternative that protects the website
from bots and spam. It is used in the registration form to prevent spam submissions.

To configure it, you need to create a site key and a secret key in the Cloudflare dashboard.
Then, you need to set `NUXT_TURNSTILE_SITE_KEY` and `NUXT_TURNSTILE_SECRET_KEY` to the respective keys.

The keys are already configured in Coolify. If you need to reconfigure them, you can find them in the
Cloudflare dashboard of the CSLabs account, managed by the IT manager.

### Email

The project uses SMTP to send emails, such as the confirmation email for registrations and broadcasts.

If you followed the quick start guide, you already configured the SMTP server in Supabase, with or without Maildev.
Please note that this configuration is different; you need to configure the Nuxt application as well, which uses
Nodemailer to send emails directly.

The environment variables for the email configuration are as you'd expect:

- `NUXT_SMTP_HOST`: The hostname of the SMTP server. For Maildev, it should be `localhost`.
- `NUXT_SMTP_PORT`: The port of the SMTP server. For Maildev, it should be `1025`.
- `NUXT_SMTP_USER`: The username for the SMTP server. For Maildev, it should be `test`.
- `NUXT_SMTP_PASSWORD`: The password for the SMTP server. For Maildev, it should be `test`.
- `NUXT_SMTP_REPLY_TO`: The email address used in the "Reply-To" field of the emails sent by the application. It should
  be set to an email address that you want to receive replies to, such as `event@cslabs.be`.

### Supabase

The project uses Supabase as the backend, which is a hosted PostgreSQL database with additional features such as
authentication and object storage.

If you followed the quick start guide, you already configured Supabase and created a project.
In the configuration, you should have set a "Publishable key" and a "Secret key", which you need to set in the
environment variables as well.

The environment variables for the Supabase configuration are:

- `SUPABASE_URL`: The URL of the Supabase instance. For a local setup, it should be `http://localhost:8000`.
- `SUPABASE_KEY`: The publishable key of the Supabase project. It should start with `sb_publishable_`, for new
  deployments. The Coolify deployment uses the older version, so it's a base64-encoded key.
- `SUPABASE_SECRET_KEY`: The secret key of the Supabase project. It should start with `sb_secret_`, for new deployments.
  The Coolify deployment uses the older version, so it's a base64-encoded key.

### Database

The project uses a PostgreSQL database, which is provided by Supabase.
The connection is configured through `DATABASE_URL`, which should be set to the connection string of the PostgreSQL
database.

To communicate with the database, Prisma is used, which uses this environment variable in `prisma.config.ts`.

If you're running the local setup with Docker, don't forget to set your tenant ID in the `DATABASE_URL` as well, as
explained in the local setup guide.

### ClamAV

ClamAV is an open-source antivirus engine used to detect and prevent malware infections.
In the platform, it is used to scan any uploaded files for malware.

The environment variables for the ClamAV configuration are:

- `CLAMAV_HOST`: The hostname of the ClamAV server. For a local setup, it should be `localhost`.
- `CLAMAV_PORT`: The port of the ClamAV server. For a local setup, it should be `3310`.
