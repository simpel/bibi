import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// `pnpm gen entity <Name>` must emit skeletons that already follow the core and web conventions
// (issue #190): structure rules hold and the core files typecheck without manual rewriting.
const CORE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(CORE_DIR, "../..");

type Planned = { relPath: string };
type GenResult = { ok: boolean; message?: string; plan?: Planned[] };
type GenModule = { generateEntity: (input: { name: string; root: string }) => GenResult };
type StructureProblem = { file: string; message: string };
type StructureModule = { runChecks: (input: { root: string }) => { problems: StructureProblem[] } };

const NAME = "GenProbeThing";
const FEATURE_DIR = "packages/core/src/features/gen-probe-thing";
let root = "";
let plan: Planned[] = [];

async function loadTool<T>({ file }: { file: string }): Promise<T> {
  return (await import(pathToFileURL(join(REPO_ROOT, "tools", file)).href)) as T;
}

type RunTscInput = { tsc: string; project: string };

// Returns the compiler's diagnostics ("" when clean) so a failure shows what is wrong.
function runTsc({ tsc, project }: RunTscInput) {
  try {
    execFileSync(process.execPath, [tsc, "-p", project], { encoding: "utf8", stdio: "pipe" });
    return "";
  } catch (error) {
    return String((error as { stdout?: string }).stdout ?? error);
  }
}

function readGenerated({ rel }: { rel: string }) {
  return readFileSync(join(root, rel), "utf8");
}

beforeAll(async () => {
  root = mkdtempSync(join(CORE_DIR, ".tmp-gen-"));
  const { generateEntity } = await loadTool<GenModule>({ file: "gen.mjs" });
  const result = generateEntity({ name: NAME, root });
  if (!result.ok || !result.plan) throw new Error(result.message ?? "generation failed");
  plan = result.plan;
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe("entity generator", () => {
  it("emits files that follow the structure rules", async () => {
    const { runChecks } = await loadTool<StructureModule>({ file: "check-structure.mjs" });
    expect(runChecks({ root }).problems).toEqual([]);
  });

  it("uses the PascalCase schema names and camelCase operation names of the real features", () => {
    const operations = readGenerated({ rel: `${FEATURE_DIR}/operations.ts` });
    expect(operations).toContain('name: "genProbeThing.list"');
    expect(operations).toContain('permission: "genProbeThing:create"');
    expect(operations).toContain("GenProbeThingCreateInputSchema");
    expect(operations).toContain('kind: "command"');
    expect(operations).not.toMatch(/\bthrow new\b|\bctx\b|kind: "mutation"|gen-probe-thing\./);
    const schema = readGenerated({ rel: `${FEATURE_DIR}/schema.ts` });
    expect(schema).toContain("export type GenProbeThingDto");
  });

  it("points the UI note at the client-safe schemas entry point", () => {
    const note = readGenerated({ rel: "apps/web/src/features/gen-probe-thing/ui/README.md" });
    expect(note).toContain("@okazi/core/schemas");
    expect(note).not.toContain("@core-schema");
  });

  it("typechecks the generated core files", () => {
    const coreSrc = join(root, "packages/core/src");
    for (const entry of readdirSync(join(CORE_DIR, "src"))) {
      if (entry === "features") continue;
      symlinkSync(join(CORE_DIR, "src", entry), join(coreSrc, entry));
    }
    const files = plan.map((p) => p.relPath).filter((p) => p.startsWith(`${FEATURE_DIR}/`));
    const tsconfig = join(root, "packages/core/tsconfig.json");
    mkdirSync(dirname(tsconfig), { recursive: true });
    const config = {
      extends: join(CORE_DIR, "../config/tsconfig.base.json"),
      compilerOptions: { types: ["node"], typeRoots: [join(CORE_DIR, "node_modules/@types")] },
      include: files.map((f) => f.replace("packages/core/", "")),
    };
    writeFileSync(tsconfig, JSON.stringify(config));
    const tsc = join(CORE_DIR, "node_modules/typescript/bin/tsc");
    expect(runTsc({ tsc, project: tsconfig })).toBe("");
  });
});
