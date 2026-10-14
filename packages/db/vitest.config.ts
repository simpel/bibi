import { defineConfig } from "vitest/config";

// Schema convention tests read `prisma/schema` only; they need no database or env.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
