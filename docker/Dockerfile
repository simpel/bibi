# Multi-stage build for any app: docker build --build-arg APP=web|mcp|worker .
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
RUN pnpm --filter @bibi/${APP} deploy --prod --legacy /deploy
# deploy drops `.next/node_modules` (hash-named links Turbopack uses for serverExternalPackages);
# recreate them against the deployed node_modules.
RUN cd apps/${APP} && if [ -d .next/node_modules ]; then \
      find .next/node_modules -type l | while read -r l; do \
        pkg=$(readlink "$l" | sed 's#.*/node_modules/##'); \
        mkdir -p "/deploy/$(dirname "$l")"; \
        ln -s "$(echo "$(dirname "$l")" | sed 's#[^/]*#..#g')/node_modules/$pkg" "/deploy/$l"; \
      done; \
    fi

FROM base AS run
ARG APP
ENV NODE_ENV=production APP=${APP}
COPY --from=build /deploy .
EXPOSE 3000 3001
# web: /api/health on WEB_PORT, mcp: /health on PORT (both without auth or database).
# worker: no HTTP port; its compose services disable this check (it logs and exits on failure).
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD sh -c 'if [ "$APP" = worker ]; then exit 0; fi; if [ "$APP" = mcp ]; then u="http://127.0.0.1:${PORT:-3001}/health"; else u="http://127.0.0.1:${WEB_PORT:-3000}/api/health"; fi; wget -q -O /dev/null "$u"'
# Runs the same commands as each app's `start` script, without pnpm: /deploy is not a workspace.
CMD ["sh", "-c", "case \"$APP\" in web) exec node_modules/.bin/next start -p ${WEB_PORT:-3000};; mcp) exec node dist/http.js;; worker) exec node dist/main.js;; esac"]
