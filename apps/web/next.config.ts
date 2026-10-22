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
};

export default withNextIntl(config);
