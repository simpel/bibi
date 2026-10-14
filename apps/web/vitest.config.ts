import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

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
