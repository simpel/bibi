import { describe, expect, it } from "vitest";
import { gridRows, isOn, isOverridden, setCell, toOverrides } from "./permission-grid";

const preset = { item: ["read"], ticket: ["read", "write"], member: ["read"] } as const;
const base = ["item:read", "ticket:read", "ticket:write", "member:read"];

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
      granted: setCell({ granted: base, feature: "item", action: "write", on: true }),
      feature: "ticket",
      action: "write",
      on: false,
    });
    expect(toOverrides({ granted, preset })).toEqual([
      { feature: "ticket", action: "write", effect: "deny" },
      { feature: "item", action: "write", effect: "allow" },
    ]);
  });

  it("turns view off for the whole feature and back on with any action", () => {
    const off = setCell({ granted: base, feature: "ticket", action: "read", on: false });
    expect(isOn({ granted: off, feature: "ticket", action: "write" })).toBe(false);
    const on = setCell({ granted: off, feature: "ticket", action: "write", on: true });
    expect(isOn({ granted: on, feature: "ticket", action: "read" })).toBe(true);
  });

  it("never marks a locked cell as overridden", () => {
    const granted = ["member:read", "member:write"];
    expect(isOverridden({ granted, preset, feature: "member", action: "write" })).toBe(false);
  });

  it("never puts always-visible view cells in the override list", () => {
    const granted = ["configuration:read", "pipeline:read", "member:read"];
    const overrides = toOverrides({ granted: [], preset: { configuration: ["read"] } });
    expect(overrides.some(({ feature }) => feature === "configuration")).toBe(false);
    expect(toOverrides({ granted, preset: {} })).toEqual([]);
  });
});
