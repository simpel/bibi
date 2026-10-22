import { defineConfig } from "tsup";

// Workspace packages export TypeScript sources, so they are bundled; every npm dependency
// (including transitive ones such as better-auth) stays external and is declared in package.json.
export default defineConfig({
  entry: ["src/http.ts", "src/stdio.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  noExternal: [/^@bibi\//],
  external: [/^(?!@bibi\/|\.|\/)/],
});
