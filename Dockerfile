FROM node:22-alpine AS base
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./

RUN corepack enable && pnpm install --prod --frozen-lockfile && pnpm add @nuxt/cli

FROM base AS build
WORKDIR /app

# Copy the entire project
COPY . ./

# Build the project
RUN pnpm run build

FROM base as runtime
WORKDIR /app

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output/ ./

# Change the port and host
ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
