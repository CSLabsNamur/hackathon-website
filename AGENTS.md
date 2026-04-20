# Repository Guidelines

## Project Structure & Module Organization

The main Nuxt 4 app lives in `app/`: page routes in `app/pages/`, shared UI in `app/components/`, stateful helpers in
`app/composables/`, layouts in `app/layouts/`, and client utilities in `app/utils/`. Nitro server code lives in
`server/`, with API handlers under `server/api/`, reusable server logic in `server/utils/`, scheduled tasks in
`server/tasks/`, mail templates in `server/mail/`, and Prisma schema/migrations in `server/prisma/`. Cross-runtime types
and schemas belong in `shared/`. Static assets live in `public/`, content pages in `content/`, and the separate
VitePress docs site in `docs/`.

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

You need to use Nuxt UI's components when building UI, and VueUse composables whenever you can.
You can also use Tailwind CSS utility classes for styling, but you need to follow the existing design direction. For
example, we do not need gradiants here.

For Vue nodes, do not line-break every attributes or properties. Put them on the same line when the whole line fit
within 100 characters, and only break them into multiple lines when they exceed that limit. For example, prefer this
style:

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

In TypeScript parts, do not break function parameters or object properties into multiple lines. Keep them on the same
line. For example, prefer this style:

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
