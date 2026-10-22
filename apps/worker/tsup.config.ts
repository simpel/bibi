import { defineConfig } from "tsup";

// Workspace packages export TypeScript sources, so they are bundled; every npm dependency
// stays external and is declared in package.json.
export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  noExternal: [/^@bibi\//],
  external: [/^(?!@bibi\/|\.|\/)/],
});
