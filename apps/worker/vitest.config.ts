import { loadTestEnv } from "@okazi/config/load-test-env";
import { defineConfig } from "vitest/config";

// Root `.env` with DATABASE_URL moved to `<db>_test` (never the dev database), AI key blanked.
loadTestEnv();

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
