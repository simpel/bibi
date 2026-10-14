import { resolve } from "node:path";
import { loadTestEnv } from "@okazi/config/load-test-env";
import { defineConfig } from "vitest/config";

// Root `.env` (a worktree's own database in a worktree), AI key blanked: tests never call paid AI.
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
