import { resolve } from "node:path";
import { loadTestEnv } from "@bibi/config/load-test-env";
import { defineConfig } from "vitest/config";

// Root `.env` with DATABASE_URL moved to `<db>_test` (never the dev database), AI key blanked.
loadTestEnv();

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(root, "src"),
      "server-only": resolve(root, "vitest/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // next-intl imports `next/navigation` without an extension; let Vite resolve it.
    server: { deps: { inline: [/next-intl/] } },
  },
});
