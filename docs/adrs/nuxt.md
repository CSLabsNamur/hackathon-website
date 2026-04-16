---
title: ADR - Nuxt
description: Why the project is built as a single Nuxt application.
---

# Nuxt

## Context

The project needs to serve a public website, a participant dashboard, an admin dashboard, and a server API.
It needs good SEO support, so SSR is a must.
Those surfaces share the same event data, the same authentication model, and the same deployment lifecycle.

## Decision

Use a single Nuxt application for the public frontend, the dashboards, and the Nitro API.

## Why

- Nuxt gives us a unified framework for both frontend and backend code, which fits the project well.
- The public pages and the dashboards can share components, styles, and data fetching logic.
- Authentication and permission logic only need to be implemented once.
- Deployment is simpler because the project remains a single deployable unit.
- Nuxt gives us SSR support out of the box.
- With Nuxt modules, we can easily integrate with SEO tools, analytics, and other services as needed.
- The opinionated structure of Nuxt helps keep the code organized, and future maintainers can quickly understand where
  to find different types of code (e.g. pages, components, server routes, etc.).
- The project is not large enough to justify the overhead of maintaining separate repositories or a custom API server.

## Alternatives considered

### Separate frontend and backend repositories

This was the case in the old website, and it caused a lot of overhead in terms of code duplication and deployment
complexity. NestJS is a great framework, very scalable and great to work with, but it's overkill for this platform.

### Use a different full-stack framework (e.g. Next.js)

Honnestly, it was solely a personnal choice. Next.js is a great framework, but I find Vue to be easier to work with, and
easier to onboard new developers on. I also just don't want to deal with useEffect.

## Downsides

- The repository structure is broader than a simple Nuxt marketing site, so documentation matters more.
- Developers need to understand both client and server conventions, even if they mostly work on one side.
- New maintainers might need to learn Vue and Nuxt a bit if they are not already familiar with it, though it should be
  straightforward to pick up.
