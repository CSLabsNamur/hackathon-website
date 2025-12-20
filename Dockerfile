FROM node:22-slim AS base
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl clamav clamav-daemon && \
    freshclam

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json pnpm-lock.yaml .npmrc prisma.config.ts ./
COPY server/prisma/schema.prisma ./server/prisma/schema.prisma

RUN corepack enable && pnpm install --prod --frozen-lockfile && pnpm add @nuxt/cli

FROM base AS build
WORKDIR /app

# Copy the entire project
COPY . ./

# Build the project
RUN pnpm run build

FROM base AS runtime
WORKDIR /app

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output ./.output
COPY --from=build /app/server/prisma ./server/prisma

# Change the port and host
ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

COPY --chmod=0755 docker-entrypoint.sh .

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "/app/.output/server/index.mjs"]
