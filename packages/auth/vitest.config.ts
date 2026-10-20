import { loadTestEnv } from "@okazi/config/load-test-env";
import { defineConfig } from "vitest/config";

// Root `.env` with DATABASE_URL moved to `<db>_test` (never the dev database), AI key blanked.
loadTestEnv();

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Tests hit the real Postgres; run files serially to keep connection count low.
    fileParallelism: false,
    testTimeout: 30_000,
    // First-party web client id used by the OAuth tests (see test/oauth-flow.ts).
    env: { WEB_OAUTH_CLIENT_ID: "okazi-web-test" },
  },
});
