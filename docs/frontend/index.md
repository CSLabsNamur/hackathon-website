---
title: Frontend Overview
description: How the client-side application is organized.
---

# Frontend Overview

The frontend is the `app/` directory of the Nuxt application.
It includes the public website, the participant dashboard, and the admin dashboard.

The public site is classic SSR (for SEO), while the dashboards are fully client-side applications.
You can look at the route rules in `nuxt.config.ts` to see how that works.

## Main directory structure

- `app/pages/`: routes
- `app/layouts/`: wrappers around pages, such as the public layout and dashboard layouts
- `app/components/`: reusable UI components
- `app/composables/`: data access and frontend logic
- `app/middleware/`: route guards
- `app/plugins/`: app-wide Nuxt plugins (e.g. the custom fetch client)
- `app/utils/`: shared client-side helpers
- `shared/schemas/`: [`Valibot`](https://valibot.dev/) validation schemas shared between client and server
- `shared/utils/`: shared permission and helper logic

## Layouts

There are three main layouts:

- the default layout for the public site;
- the admin dashboard layout;
- the participant dashboard layout.

The layouts do more than visual framing.
They also load the current user context, build the navigation and expose page action buttons (e.g. "Create new role" on
the roles page of the admin panel).

## Data access pattern

No page should not call `useFetch` or `$fetch` directly. In fact, nowhere should you call those directly, because we
have a custom wrapper around Nuxt's fetch API that adds auth headers, error handling, and CSRF protection.

The usual pattern is:

1. create or reuse a composable such as `useParticipants`, `useRoles`, `useRooms`, or `useSettings`;
2. let that composable call `useAPI(...)` if it's the main getter for the model, or the shared `$api` client for
   model actions;
3. keep the page focused on page state and UI concerns.

This gives us a consistent structure:

- pages define the layout, route middleware and page meta;
- composables fetch and mutate;
- components render and emit events.

## Access control on the frontend

While the backend is the final authority on permissions, the frontend also has a concept of "ability" that it derives
from the current user context, so that it can hide or disable UI elements that the user shouldn't interact with.
This is implemented through the `useAbility` composable, which checks whether the current user can perform certain
actions on certain models.

## Creating new pages - UI conventions

If you want to create a new page, the biggest advice I could give is to check out the existing pages and follow their
patterns.
In general, check out if you:

- set the right layout, middleware and permissions through `definePageMeta`;
- if it's a public page, set the SEO meta tags through `useSeoMeta` and other utils from Nuxt SEO;
- loaded the right data from the right composable;
- checked user permissions through `useAbility` and rendered the right UI elements accordingly.

These ones are an absolute necessity. Beyond that, you can also check out the following UI conventions:

- Use VueUse composables whenever you can, especially for common patterns like debouncing or getting the browser state;
- Use Nuxt UI components whenever you can, especially for common UI patterns like cards, tables, dropdowns, modals and
  overlays;
- Followed the global UX direction of the website (e.g. for a page in the dashboard, "create" button on the top right, "
  edit" and "delete" actions in the table row, etc.).
- Try and think of whether the code could be reused in other pages, and if so, whether it should be extracted to a
  composable or a component (DRY). I'm not saying to abstract everything possible; I don't like abstracting a single-use
  check or function, it often makes the code harder to read more than it helps. Use your own judgement here.

## Good first places to look

If you need practical examples, these pages are good references:

- The registration page, for a simple public page with form submission and error handling;
- The admin home page, for permission-gated overview cards;
- The participants page in the admin panel, for a full dashboard CRUD view.

