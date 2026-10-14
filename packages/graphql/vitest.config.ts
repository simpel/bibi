import { loadTestEnv } from "@okazi/config/load-test-env";
import { defineConfig } from "vitest/config";

// Root `.env` (a worktree's own database in a worktree), AI key blanked: tests never call paid AI.
loadTestEnv();

export default defineConfig({
  resolve: { dedupe: ["graphql"] },
  test: {
    include: ["test/**/*.test.ts"],
    // Tests hit the real Postgres; run files serially to keep connection count low.
    fileParallelism: false,
    testTimeout: 20_000,
    // graphql ships CJS and ESM copies; inline everything that touches it so `instanceof` agrees.
    server: { deps: { inline: [/graphql/, /@pothos/, /@envelop/, /@escape\.tech/] } },
  },
});
