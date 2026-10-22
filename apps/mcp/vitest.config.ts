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
    // graphql ships CJS and ESM copies; inline everything that touches it so `instanceof` agrees.
    server: { deps: { inline: [/graphql/, /@pothos/, /@envelop/, /@escape\.tech/] } },
  },
});
