FROM node:22.23.4-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY docker/prisma/package.json ./docker/prisma/package.json

RUN corepack enable && corepack install
RUN --mount=type=cache,id=hackathon-pnpm,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --ignore-scripts --store-dir=/pnpm/store

FROM dependencies AS prepare

COPY . ./

# Generation needs a URL, but never connects to a database during the build.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG SUPABASE_URL
ENV SUPABASE_URL=${SUPABASE_URL}
ARG NUXT_SITE_URL
ENV NUXT_SITE_URL=${NUXT_SITE_URL}

# Source files must be present before the root postinstall prepares Nuxt and Prisma.
RUN pnpm rebuild --pending

FROM prepare AS build

RUN pnpm run build

FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=80
ENV HOST=0.0.0.0

COPY --from=build --chown=node:node /app/.output ./.output

RUN chown node:node /app
USER node
EXPOSE 80

CMD ["node", "/app/.output/server/index.mjs"]
