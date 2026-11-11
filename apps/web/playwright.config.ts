import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { defineConfig } from "@playwright/test";

// Same root `.env` as next.config.ts, so a worktree's own ports and database apply here too.
// Default import: Playwright loads this file as native ESM, where @next/env (CJS) has no named exports.
nextEnv.loadEnvConfig(resolve(process.cwd(), "../.."));

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3330";
const WEB_PORT = new URL(WEB_URL).port || "3330";

// Preinstalled Chromium (sandbox) when present; otherwise Playwright's own browser (CI installs it).
const PREINSTALLED_CHROMIUM = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const chromiumPath = existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined;

/**
 * E2E against a production build: `pnpm --filter @bibi/web build` first, with DATABASE_URL,
 * BETTER_AUTH_SECRET, BETTER_AUTH_URL and WEB_OAUTH_CLIENT_ID set (see CLAUDE.md). The web app also
 * serves MCP (ADR 0104). Uses the preinstalled Chromium (no `playwright install`). A server already
 * running on WEB_URL (default :3330, per-worktree ports from the root `.env`) is reused.
 *
 * The web server starts with `E2E_MOCK_MODEL=1`: the chat route then uses the scripted model in
 * `src/server/e2e-mock-model.ts` instead of a real LLM. The flag is ignored in production, and
 * `next start` sets NODE_ENV=production unless told otherwise, so the server gets NODE_ENV=test.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"]],
  use: {
    baseURL: WEB_URL,
    locale: "sv-SE",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: chromiumPath,
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    {
      command: "pnpm start",
      url: `${WEB_URL}/sv/login`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        WEB_PORT,
        NODE_ENV: "test",
        E2E_MOCK_MODEL: "1",
        E2E_MEMORY_PROVIDERS: "1",
        // Connections seal their credentials (Swish in the payments spec); a throwaway key will do.
        INTEGRATION_SECRET_KEY:
          process.env.INTEGRATION_SECRET_KEY || randomBytes(32).toString("base64"),
      } as Record<string, string>,
    },
  ],
});
