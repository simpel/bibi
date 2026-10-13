import { defineConfig } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

/**
 * E2E smoke against a production build: `pnpm build` first, with DATABASE_URL,
 * BETTER_AUTH_SECRET and BETTER_AUTH_URL set (see CLAUDE.md). Uses the preinstalled Chromium
 * (no `playwright install`). A running server on :3000 is reused.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "sv-SE",
    trace: "retain-on-failure",
    launchOptions: { executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] },
  },
  webServer: {
    command: "pnpm start",
    url: `${BASE_URL}/sv/login`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
