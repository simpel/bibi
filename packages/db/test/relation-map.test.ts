import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { relationMapSource } from "../scripts/relation-map";

describe("relation map (ADR 0113)", () => {
  it("is generated from the current schema (run `pnpm --filter @bibi/db gen:relations`)", () => {
    const file = join(import.meta.dirname, "..", "src", "scoped", "relation-map.generated.ts");
    expect(readFileSync(file, "utf8")).toBe(relationMapSource());
  });
});
