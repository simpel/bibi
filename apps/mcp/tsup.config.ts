import { defineConfig } from "tsup";

// Workspace packages export TypeScript sources, so they are bundled; npm dependencies stay external.
export default defineConfig({
  entry: ["src/http.ts", "src/stdio.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  noExternal: [/^@okazi\//],
});
