import { loadTestEnv } from "@bibi/config/load-test-env";
import { defineConfig } from "vitest/config";

// Config modules read validated env; load the root `.env` before tests run.
loadTestEnv();

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
