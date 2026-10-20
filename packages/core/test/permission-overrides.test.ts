import { describe, expect, it } from "vitest";
import { applyOverrides, isValidOverride, PRESET_PERMISSIONS } from "../src/index";

describe("presets and overrides (ADR 0050)", () => {
  it("gives managers the daily work and members only views", () => {
    expect(PRESET_PERMISSIONS.manager.quote).toEqual(["read", "write", "delete"]);
    expect(PRESET_PERMISSIONS.manager.item).toEqual(["read"]);
    expect(PRESET_PERMISSIONS.member.ticket).toEqual(["read"]);
    expect(PRESET_PERMISSIONS.member.audit).toBeUndefined();
    expect(PRESET_PERMISSIONS.admin.member).toEqual(["read", "write", "delete"]);
  });

  it("adds allow and removes deny on top of the preset", () => {
    const effective = applyOverrides({
      preset: "member",
      overrides: [
        { feature: "item", action: "write", effect: "allow" },
        { feature: "ticket", action: "read", effect: "deny" },
      ],
    });
    expect(effective.item).toEqual(["read", "write"]);
    expect(effective.ticket).toBeUndefined();
  });

  it("hides a whole feature when view is denied, even if other actions are in the preset", () => {
    const effective = applyOverrides({
      preset: "manager",
      overrides: [{ feature: "payment", action: "read", effect: "deny" }],
    });
    expect(effective.payment).toBeUndefined();
  });

  it("ignores locked, unknown and stale overrides", () => {
    const overrides = [
      { feature: "member", action: "write", effect: "allow" },
      { feature: "apiKey", action: "write", effect: "allow" },
      { feature: "venue", action: "fly", effect: "allow" },
      { feature: "nope", action: "read", effect: "allow" },
    ];
    expect(applyOverrides({ preset: "member", overrides })).toEqual(PRESET_PERMISSIONS.member);
    expect(isValidOverride({ feature: "venue", action: "read" })).toBe(true);
    // Shared vocabulary: view is always granted and cannot be denied (ADR 0050).
    expect(isValidOverride({ feature: "member", action: "read" })).toBe(false);
    expect(isValidOverride({ feature: "configuration", action: "read" })).toBe(false);
    expect(isValidOverride({ feature: "paymentAccount", action: "write" })).toBe(false);
  });

  it("grants nothing without a preset, whatever the overrides", () => {
    const overrides = [{ feature: "item", action: "read", effect: "allow" }];
    expect(applyOverrides({ preset: null, overrides })).toEqual({ item: ["read"] });
  });
});
