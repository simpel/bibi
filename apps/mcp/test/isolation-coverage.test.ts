import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createCoreOperations, listOperations, registerOperations } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { toToolName } from "../src/tools/tool-name";
import { fakeEmbed } from "./fake-embed";
import { ISOLATION_GAPS } from "./isolation-gaps";

registerOperations({ operations: createCoreOperations({ embed: fakeEmbed }) });

/** Any quoted word: `name: "x_y"` and tuple style `["x_y", args]` both count. Matched against tool names. */
const TOOL_CALL = /"([A-Za-z]+(?:_[A-Za-z]+)?)"/g;

/** Tool names that an `isolation*.test.ts` file calls as another organization. */
function coveredTools(): Set<string> {
  const dir = import.meta.dirname;
  const files = readdirSync(dir).filter((file) => /^isolation.*\.(test\.)?ts$/.test(file));
  const covered = new Set<string>();
  for (const file of files) {
    if (file.startsWith("isolation-coverage") || file === "isolation-gaps.ts") continue;
    for (const match of readFileSync(join(dir, file), "utf8").matchAll(TOOL_CALL)) {
      if (match[1]) covered.add(match[1]);
    }
  }
  return covered;
}

const toolOf = ({ name }: { name: string }): string => toToolName({ operation: name });

describe("isolation coverage: every operation is exercised as another organization", () => {
  it("covers every operation or lists it in ISOLATION_GAPS", () => {
    const covered = coveredTools();
    const gaps = new Set<string>(ISOLATION_GAPS);
    const missing = listOperations()
      .map((op) => op.name)
      .filter((name) => !covered.has(toolOf({ name })) && !gaps.has(name));
    expect(
      missing,
      `No cross-organization isolation test calls: ${missing.join(", ")}. ` +
        "Fix: add a step to apps/mcp/test/isolation-<area>.test.ts where organization B calls the tool with organization A's ids and gets NOT_FOUND (see skill new-feature). Do not add to ISOLATION_GAPS.",
    ).toEqual([]);
  });

  it("keeps ISOLATION_GAPS honest: no entry is covered or unknown", () => {
    const covered = coveredTools();
    const names = new Set(listOperations().map((op) => op.name));
    const stale = ISOLATION_GAPS.filter(
      (name) => covered.has(toolOf({ name })) || !names.has(name),
    );
    expect(
      stale,
      `Remove from apps/mcp/test/isolation-gaps.ts (now covered or no longer an operation): ${stale.join(", ")}`,
    ).toEqual([]);
  });
});
