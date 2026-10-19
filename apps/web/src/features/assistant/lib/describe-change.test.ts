import { describe, expect, it } from "vitest";
import { describeFieldChange } from "./describe-change";

describe("describeFieldChange", () => {
  it("names the setup in the path and keeps the capacity numbers", () => {
    const described = describeFieldChange({
      change: { path: "setups.s1.capacity", before: 10, after: 12 },
      names: { s1: "Boardroom" },
    });
    expect(described.segments).toEqual([
      { kind: "field", key: "setups" },
      { kind: "text", text: "Boardroom" },
      { kind: "field", key: "capacity" },
    ]);
    expect(described.before).toEqual({ kind: "text", text: "10" });
    expect(described.after).toEqual({ kind: "text", text: "12" });
  });

  it("shows amounts in minor units as money and missing values as empty", () => {
    const described = describeFieldChange({
      change: { path: "priceMinor", before: null, after: 450_000 },
      names: {},
    });
    expect(described.before).toEqual({ kind: "empty" });
    expect(described.after).toEqual({ kind: "money", minor: 450_000 });
  });

  it("replaces ids in values with names", () => {
    const described = describeFieldChange({
      change: { path: "venueId", before: "v1", after: "v2" },
      names: { v1: "Main house", v2: "Annex" },
    });
    expect(described.before).toEqual({ kind: "text", text: "Main house" });
    expect(described.after).toEqual({ kind: "text", text: "Annex" });
  });
});
