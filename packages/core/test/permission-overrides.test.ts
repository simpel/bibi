import { describe, expect, it } from "vitest";
import { applyOverrides, isValidOverride, PRESET_PERMISSIONS } from "../src/index";

describe("presets and overrides (ADR 0050)", () => {
  it("gives managers the daily work and members only views", () => {
    expect(PRESET_PERMISSIONS.manager.quote).toEqual(["view", "create", "edit", "remove", "send"]);
    expect(PRESET_PERMISSIONS.manager.item).toEqual(["view"]);
    expect(PRESET_PERMISSIONS.member.ticket).toEqual(["view"]);
    expect(PRESET_PERMISSIONS.member.audit).toBeUndefined();
    expect(PRESET_PERMISSIONS.admin.member).toEqual(["view", "create", "edit", "remove"]);
  });

  it("adds allow and removes deny on top of the preset", () => {
    const effective = applyOverrides({
      preset: "member",
      overrides: [
        { feature: "item", action: "create", effect: "allow" },
        { feature: "ticket", action: "view", effect: "deny" },
      ],
    });
    expect(effective.item).toEqual(["view", "create"]);
    expect(effective.ticket).toBeUndefined();
  });

  it("hides a whole feature when view is denied, even if other actions are in the preset", () => {
    const effective = applyOverrides({
      preset: "manager",
      overrides: [{ feature: "payment", action: "view", effect: "deny" }],
    });
    expect(effective.payment).toBeUndefined();
  });

  it("ignores locked, unknown and stale overrides", () => {
    const overrides = [
      { feature: "member", action: "edit", effect: "allow" },
      { feature: "apiKey", action: "create", effect: "allow" },
      { feature: "venue", action: "fly", effect: "allow" },
      { feature: "nope", action: "view", effect: "allow" },
    ];
    expect(applyOverrides({ preset: "member", overrides })).toEqual(PRESET_PERMISSIONS.member);
    expect(isValidOverride({ feature: "venue", action: "view" })).toBe(true);
    // Shared vocabulary: view is always granted and cannot be denied (ADR 0050).
    expect(isValidOverride({ feature: "member", action: "view" })).toBe(false);
    expect(isValidOverride({ feature: "configuration", action: "view" })).toBe(false);
    expect(isValidOverride({ feature: "paymentAccount", action: "edit" })).toBe(false);
  });

  it("grants nothing without a preset, whatever the overrides", () => {
    const overrides = [{ feature: "item", action: "view", effect: "allow" }];
    expect(applyOverrides({ preset: null, overrides })).toEqual({ item: ["view"] });
  });
});
