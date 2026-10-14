import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Tests hit the real Postgres; run files serially to keep connection count low.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
