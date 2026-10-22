import { loadTestEnv } from "@bibi/config/load-test-env";
import { defineConfig } from "vitest/config";

// Root `.env` with DATABASE_URL moved to `<db>_test` (never the dev database), AI key blanked.
loadTestEnv();

export default defineConfig({
  resolve: { dedupe: ["graphql"] },
  test: {
    include: ["test/**/*.test.ts"],
    // Tests hit the real Postgres; run files serially to keep connection count low.
    fileParallelism: false,
    testTimeout: 30_000,
    // First-party web client id (tests register it) + no Gateway key: no network, ever.
    env: { WEB_OAUTH_CLIENT_ID: "bibi-web-test", AI_GATEWAY_API_KEY: "" },
    // The in-process MCP server (apps/mcp) pulls graphql, which ships CJS + ESM copies.
    server: { deps: { inline: [/graphql/, /@pothos/, /@envelop/, /@escape\.tech/] } },
  },
});
