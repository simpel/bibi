import { describe, expect, it } from "vitest";
import { gridRows, isOn, isOverridden, setCell, toOverrides } from "./permission-grid";

const preset = { item: ["view"], ticket: ["view", "edit"], member: ["view"] } as const;
const base = ["item:view", "ticket:view", "ticket:edit", "member:view"];

describe("permission grid", () => {
  it("lists every feature once, grouped", () => {
    const rows = gridRows();
    expect(new Set(rows.map((row) => row.feature)).size).toBe(rows.length);
    expect(rows[0]?.group).toBe("bookings");
  });

  it("gives no overrides when nothing differs from the preset", () => {
    expect(toOverrides({ granted: base, preset })).toEqual([]);
  });

  it("allows an extra action and denies a removed one", () => {
    const granted = setCell({
      granted: setCell({ granted: base, feature: "item", action: "edit", on: true }),
      feature: "ticket",
      action: "edit",
      on: false,
    });
    expect(toOverrides({ granted, preset })).toEqual([
      { feature: "ticket", action: "edit", effect: "deny" },
      { feature: "item", action: "edit", effect: "allow" },
    ]);
  });

  it("turns view off for the whole feature and back on with any action", () => {
    const off = setCell({ granted: base, feature: "ticket", action: "view", on: false });
    expect(isOn({ granted: off, feature: "ticket", action: "edit" })).toBe(false);
    const on = setCell({ granted: off, feature: "ticket", action: "edit", on: true });
    expect(isOn({ granted: on, feature: "ticket", action: "view" })).toBe(true);
  });

  it("never marks a locked cell as overridden", () => {
    const granted = ["member:view", "member:edit"];
    expect(isOverridden({ granted, preset, feature: "member", action: "edit" })).toBe(false);
  });

  it("never puts always-visible view cells in the override list", () => {
    const granted = ["configuration:view", "pipeline:view", "member:view"];
    const overrides = toOverrides({ granted: [], preset: { configuration: ["view"] } });
    expect(overrides.some(({ feature }) => feature === "configuration")).toBe(false);
    expect(toOverrides({ granted, preset: {} })).toEqual([]);
  });
});
