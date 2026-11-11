# Multi-stage build, one target per image (built by release.yml):
#   docker build --target web     --build-arg APP=web .
#   docker build --target node    --build-arg APP=worker .
#   docker build --target migrate --build-arg APP=db .
# Runtime images hold only the files the app loads (Next's standalone output for web, docker/trace.mjs
# for the worker), never node_modules or build caches: a release must fit a small server's disk.
FROM node:22-alpine AS base
RUN corepack enable && apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS prune
ARG APP
COPY . .
RUN pnpm dlx turbo@2.11.8 prune @bibi/${APP} --docker

FROM base AS build
ARG APP
COPY --from=prune /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prune /app/out/full/ .
RUN pnpm exec turbo run build --filter=@bibi/${APP}

FROM node:22-alpine AS runtime
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production

# Next's minimal server.js does not include static assets; they are served from next to it.
FROM build AS build-web
RUN cd apps/web && cp -r .next/static .next/standalone/apps/web/.next/static \
  && cp -r public .next/standalone/apps/web/public

FROM runtime AS web
COPY --from=build-web /app/apps/web/.next/standalone .
EXPOSE 3330
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${WEB_PORT:-3330}/api/health"
# Same port as the app's `start` script; HOSTNAME makes server.js listen on every interface.
CMD ["sh", "-c", "PORT=${WEB_PORT:-3330} HOSTNAME=0.0.0.0 exec node apps/web/server.js"]

FROM build AS build-node
COPY docker/trace.mjs docker/trace.mjs
RUN node docker/trace.mjs /deploy apps/${APP}/dist/*.js

# The worker has no HTTP port. MCP is served by the web image (ADR 0104).
FROM runtime AS node
ARG APP
ENV APP=${APP}
COPY --from=build-node /deploy .
CMD ["node", "apps/worker/dist/main.js"]

# One-off `prisma migrate deploy` before a rollout: the schema, migrations and the Prisma CLI.
FROM build AS build-migrate
RUN pnpm --filter @bibi/db deploy --prod --legacy /deploy

FROM runtime AS migrate
COPY --from=build-migrate /deploy .
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]
