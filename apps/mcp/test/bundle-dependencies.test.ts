import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Manifest = { dependencies?: Record<string, string> };

const ROOT = resolve(import.meta.dirname, "../../..");

const readManifest = ({ path }: { path: string }): Manifest =>
  JSON.parse(readFileSync(resolve(ROOT, path), "utf8")) as Manifest;

const workspaceDir = ({ name }: { name: string }) => `packages/${name.replace("@okazi/", "")}`;

/** npm (non-workspace) dependencies of every @okazi package reachable from `start`. */
function bundledNpmDependencies({ start }: { start: Manifest }): Set<string> {
  const npm = new Set<string>();
  const seen = new Set<string>();
  const queue = Object.keys(start.dependencies ?? {}).filter((dep) => dep.startsWith("@okazi/"));
  while (queue.length > 0) {
    const name = queue.shift() as string;
    if (seen.has(name)) continue;
    seen.add(name);
    const deps = Object.keys(
      readManifest({ path: `${workspaceDir({ name })}/package.json` }).dependencies ?? {},
    );
    for (const dep of deps) dep.startsWith("@okazi/") ? queue.push(dep) : npm.add(dep);
  }
  return npm;
}

describe("tsup bundle (tsup.config.ts)", () => {
  it("declares every npm dependency of the bundled workspace packages", () => {
    // Workspace packages are bundled but their npm deps stay external: `node dist/http.js` (and
    // the Docker image) can only resolve what apps/mcp itself declares.
    const mcp = readManifest({ path: "apps/mcp/package.json" });
    const declared = new Set(Object.keys(mcp.dependencies ?? {}));
    const missing = [...bundledNpmDependencies({ start: mcp })].filter((dep) => !declared.has(dep));
    expect(missing).toEqual([]);
  });
});
