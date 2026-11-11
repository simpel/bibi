import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The repo keeps one `.env` at the root; load it before @bibi/config reads the environment.
// forceReload: Next has already called loadEnvConfig for apps/web, and @next/env caches that result.
loadEnvConfig(
  resolve(import.meta.dirname, "../.."),
  process.env.NODE_ENV !== "production",
  console,
  true,
);

// next-intl needs a default export in its request config; `*.config.ts` is the allowed place.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.config.ts");

const config: NextConfig = {
  // The Docker image ships only the traced files (`.next/standalone`), not node_modules or the build
  // cache. Trace from the repo root so workspace packages and pnpm's store are included.
  output: "standalone",
  outputFileTracingRoot: resolve(import.meta.dirname, "../.."),
  // Workspace packages ship TypeScript sources (no build step).
  transpilePackages: [
    "@bibi/api",
    "@bibi/auth",
    "@bibi/config",
    "@bibi/ai",
    "@bibi/core",
    "@bibi/db",
    "@bibi/graphql",
    "@bibi/i18n",
    "@bibi/logger",
    "@bibi/mail",
    "@bibi/ui",
  ],
  serverExternalPackages: ["pg", "nodemailer", "pino", "pino-pretty"],
  // `/docs` was split into `/support` (staff) and `/developers`; old links keep working.
  async redirects() {
    const moves = [
      { from: "/docs/guide/:slug", to: "/support/:slug" },
      { from: "/docs/developers/overview", to: "/developers" },
      { from: "/docs/developers/:slug", to: "/developers/:slug" },
      { from: "/docs/reference/:slug", to: "/developers/reference/:slug" },
      { from: "/docs", to: "/support" },
    ];
    return moves.flatMap(({ from, to }) => [
      { source: `/:locale(sv|en)${from}`, destination: `/:locale${to}`, permanent: true },
      { source: from, destination: to, permanent: true },
    ]);
  },
};

export default withNextIntl(config);
