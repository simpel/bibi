import { grantAll, PRESET_PERMISSIONS } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { accessSection } from "../src/prompt/access-section";

describe("accessSection (ADR 0050)", () => {
  it("tells the assistant what a manager may do per feature and what they cannot see", () => {
    const text = accessSection({ roles: ["manager"], permissions: PRESET_PERMISSIONS.manager });
    expect(text).toContain('Preset: "manager"');
    expect(text).toContain("  - ticket: read, write, delete");
    expect(text).toContain("  - item: read, write; not delete");
    expect(text).toMatch(/Cannot see: .*audit/);
  });

  it("lets an admin do everything", () => {
    const text = accessSection({ roles: ["admin"], permissions: grantAll({}) });
    expect(text).not.toContain("; not ");
    expect(text).toContain("Cannot see: nothing hidden");
  });
});
