import { loadTestEnv } from "@okazi/config/load-test-env";
import { defineConfig } from "vitest/config";

// Root `.env` (a worktree's own database in a worktree), AI key blanked: tests never call paid AI.
loadTestEnv();

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
