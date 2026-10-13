import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      "@core-schema/venue": resolve(root, "../../packages/core/src/features/venue/schema.ts"),
      "@core-schema/room": resolve(root, "../../packages/core/src/features/room/schema.ts"),
      "@": resolve(root, "src"),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
