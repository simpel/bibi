# Multi-stage build for any app: docker build --build-arg APP=web|mcp .
FROM node:22-alpine AS base
RUN corepack enable && apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS prune
ARG APP
COPY . .
RUN pnpm dlx turbo@2.5.8 prune @okazi/${APP} --docker

FROM base AS build
ARG APP
COPY --from=prune /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prune /app/out/full/ .
RUN pnpm --filter @okazi/db generate && pnpm --filter @okazi/${APP} build

FROM base AS run
ARG APP
ENV NODE_ENV=production APP=${APP}
COPY --from=build /app .
EXPOSE 3000 3001
# web: /api/health on WEB_PORT, mcp: /health on PORT (both without auth or database).
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD sh -c 'if [ "$APP" = mcp ]; then u="http://127.0.0.1:${PORT:-3001}/health"; else u="http://127.0.0.1:${WEB_PORT:-3000}/api/health"; fi; wget -q -O /dev/null "$u"'
CMD ["sh", "-c", "pnpm --filter @okazi/${APP} start"]
