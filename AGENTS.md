# Repository Guidelines

## Project Structure & Module Organization

The main Nuxt 4 app lives in `app/`: page routes in `app/pages/`, shared UI in `app/components/`, stateful helpers in
`app/composables/`, layouts in `app/layouts/`, and client utilities in `app/utils/`. Nitro server code lives in
`server/`, with API handlers under `server/api/`, reusable server logic in `server/utils/`, scheduled tasks in
`server/tasks/`, mail templates in `server/mail/`, and Prisma schema/migrations in `server/prisma/`. Cross-runtime types
and schemas belong in `shared/`. Static assets live in `public/`, content pages in `content/`, and the separate
VitePress docs site in `docs/`.

Keep route-level data loading and coordination in pages, focused UI in components, and reusable reactive state in
composables. Keep pure helpers in the existing utility layer and contracts used by both client and server in `shared/`.

## Build, Test, and Development Commands

Use `pnpm install` after enabling Corepack, then copy `.env.example` to `.env`.

- `pnpm dev` starts Nuxt locally and runs the mail, Prisma client, and permission pre-steps.
- `pnpm lint` runs ESLint across the repository.
- `pnpm typecheck` runs `nuxi typecheck`.
- `pnpm build` creates the production build; `pnpm preview` serves it locally.
    - For testing, don't build the whole app, it takes a long time. Instead, just lint and typecheck.
- `pnpm db:migrate`, `pnpm db:seed`, and `pnpm db:studio` cover Prisma schema changes and local data work.
- `pnpm docs:dev` starts the VitePress documentation workspace in `docs/`.

## Coding Style & Naming Conventions

Write TypeScript and Vue SFCs using 2-space indentation, semicolons, and double quotes, matching the existing codebase.
Prefer `<script setup lang="ts">` in Vue files. Use `PascalCase.vue` for components, `useX.ts` for composables, and keep
page and API filenames aligned with Nuxt/Nitro routing conventions such as `app/pages/admin/settings.vue` and
`server/api/roles/[id]/index.put.ts`. Do not hand-edit generated files in `server/prisma/generated/prisma/` or
`server/mail/generated/`; regenerate them instead.

Build UI with Nuxt UI components and use VueUse composables where they fit. Use the project's dayjs helpers for dates
and reuse existing domain logic, such as `useEventPhase`, `useAbility`, and `useCopyWithToast`.
Use Tailwind utilities with Nuxt UI's semantic colors and the app's existing borders and spacing. Avoid gradients.

Prefer `grid gap-*` for stacked sections and card content, and `flex ... gap-*` for inline groups. Use `min-w-0` and
appropriate text wrapping for long values in flex or grid layouts. Use `place-self-start` when a grid action should
keep its natural width.

Keep Vue tag attributes on one line when the tag fits within 100 characters. For longer tags, group related
attributes on each line and align continuation lines with the first attribute. Use `/>` for empty components.
For example:

```vue

<template>
  <div class="flex items-center gap-2">
    <BaseIcon :icon="icon" class="w-4 h-4"/>
    <span>{{ label }}</span>
  </div>
</template>
```

rather than this:

```vue

<template>
  <div
      class="flex items-center gap-2"
  >
    <BaseIcon
        :icon="icon"
        class="w-4 h-4"
    />
    <span>{{ label }}</span>
  </div>
</template>
```

For classes, if you need to break them into multiple lines, indent the new line to align it with the others, like this:

```vue

<template>
  <div class="flex items-center gap-2
              bg-gray-100 p-4">
    <span>{{ label }}</span>
  </div>
</template>
```

Keep short TypeScript parameter lists and simple object literals inline. Use spaces inside inline Vue prop and emit
types, as in `defineProps<{ participant: CurrentParticipant }>()`. Separate related groups of declarations and handlers
with blank lines. For example:

```ts
function createUser(name: string, email: string): User {
  return {name, email};
}
```

rather than this:

```ts
function createUser(
  name: string,
  email: string
): User {
  return {name, email};
}
```

## Participant Dashboard UI

Match the adjacent participant pages. Use simple cards and compact actions, put page-level edit actions in the
dashboard navbar via `useDashboardNavbar`, and give icon-only controls accessible labels. Use actual event or
participant data, omit optional content when it is unavailable, and distinguish loading, empty, error, and success
states. Check the layout at narrow and desktop widths.

See [the participant homepage](app/pages/participant/index.vue) and
[its team card](app/components/participant/DashboardTeamCard.vue) for spacing and markup, [My team](app/pages/participant/team.vue)
for page and card structure, and [Submissions](app/pages/participant/submit.vue) for keeping forms separate from
workspace state and preserving drafts through refreshes.

## Testing Guidelines

There is no dedicated unit-test suite committed yet. Treat `pnpm lint`, `pnpm typecheck`, and `pnpm build` as the
minimum required checks because CI runs those on pushes and pull requests. For changes touching admin flows, auth,
uploads, email, or Prisma models, also do a local smoke test against a real `.env` setup.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style visible in Git history: `feat(ui): ...`, `fix: ...`, `docs: ...`,
`chore: ...`. Keep commits scoped and imperative. Pull requests should include a short description, linked issue when
applicable, notes for schema or environment changes, and screenshots for visible UI updates. Confirm lint, typecheck,
and build pass before requesting review.

## Security & Configuration Tips

Never commit secrets from `.env`. This app depends on Postgres, Supabase, SMTP, and optional ClamAV-backed upload
scanning; document any new required variables in `.env.example`.
