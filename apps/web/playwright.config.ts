import { resolve } from "node:path";
import nextEnv from "@next/env";
import { defineConfig } from "@playwright/test";

// Same root `.env` as next.config.ts, so a worktree's own ports and database apply here too.
// Default import: Playwright loads this file as native ESM, where @next/env (CJS) has no named exports.
nextEnv.loadEnvConfig(resolve(process.cwd(), "../.."));

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const MCP_URL = process.env.MCP_URL ?? "http://localhost:3001";
const WEB_PORT = new URL(WEB_URL).port || "3000";
const MCP_PORT = new URL(MCP_URL).port || "3001";

/**
 * E2E against a production build: `pnpm build` first (web and mcp), with DATABASE_URL,
 * BETTER_AUTH_SECRET, BETTER_AUTH_URL and WEB_OAUTH_CLIENT_ID set (see CLAUDE.md). Uses the
 * preinstalled Chromium (no `playwright install`). Servers already running on WEB_URL / MCP_URL
 * (default :3000 / :3001, per-worktree ports from the root `.env`) are reused.
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
  reporter: [["list"]],
  use: {
    baseURL: WEB_URL,
    locale: "sv-SE",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    {
      command: "node ../mcp/dist/http.js",
      url: `${MCP_URL}/health`,
      reuseExistingServer: true,
      timeout: 60_000,
      env: { ...process.env, MCP_URL, PORT: MCP_PORT } as Record<string, string>,
    },
    {
      command: "pnpm start",
      url: `${WEB_URL}/sv/login`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        MCP_URL,
        WEB_PORT,
        NODE_ENV: "test",
        E2E_MOCK_MODEL: "1",
      } as Record<string, string>,
    },
  ],
});
