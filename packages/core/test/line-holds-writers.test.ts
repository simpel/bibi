import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(import.meta.dirname, "../src");

/**
 * The only core files that may write `Occupancy` (ADR 0053): the manual-block operations, and
 * the demo reset that deletes an organization.
 */
const ALLOWED = new Set(["features/occupancy/write-operations.ts", "seed/demo/reset.ts"]);

const WRITE =
  /\.occupancy\s*\.\s*(create|createMany|createManyAndReturn|update|updateMany|updateManyAndReturn|upsert|delete|deleteMany)\b/;

const filesUnder = ({ dir }: { dir: string }): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder({ dir: path }) : [path];
  });

describe("line holds have one writer (ADR 0053)", () => {
  it("core writes occupancy only in the manual-block operations", () => {
    const writers = filesUnder({ dir: SRC })
      .filter((path) => path.endsWith(".ts"))
      .filter((path) => WRITE.test(readFileSync(path, "utf8")))
      .map((path) => relative(SRC, path));
    expect(writers.filter((path) => !ALLOWED.has(path))).toEqual([]);
  });
});
