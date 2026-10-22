import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { RESERVED_SLUGS } from "@bibi/auth/reserved-slugs";
import { describe, expect, it } from "vitest";
import { SCOPED_RESERVED_SEGMENTS, UNSCOPED_SEGMENTS } from "./org-path";

const LOCALE_DIR = resolve(import.meta.dirname, "../app/[locale]");

type SegmentsInput = { dir: string };

/** Top-level URL segments under `[locale]`, looking through route groups like `(auth)`. */
function topLevelSegments({ dir }: SegmentsInput): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      if (entry.name.startsWith("(")) return topLevelSegments({ dir: join(dir, entry.name) });
      if (entry.name.startsWith("[")) return [];
      return [entry.name];
    });
}

describe("reserved organization slugs (ADR 0062)", () => {
  it("cover every unscoped top-level route", () => {
    const segments = topLevelSegments({ dir: LOCALE_DIR });
    expect(segments).toContain("login");
    expect(segments.filter((segment) => !RESERVED_SLUGS.has(segment))).toEqual([]);
  });

  it("treat a top-level route as unscoped and app sections as scoped", () => {
    for (const segment of topLevelSegments({ dir: LOCALE_DIR })) {
      expect(UNSCOPED_SEGMENTS.has(segment)).toBe(true);
    }
    for (const segment of SCOPED_RESERVED_SEGMENTS) {
      expect(RESERVED_SLUGS.has(segment)).toBe(true);
      expect(UNSCOPED_SEGMENTS.has(segment)).toBe(false);
    }
  });
});
