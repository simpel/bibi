import { describe, expect, it } from "vitest";
import { describeFieldChange, visibleFields } from "./describe-change";

describe("describeFieldChange", () => {
  it("names the layout in the path and keeps the capacity numbers", () => {
    const described = describeFieldChange({
      change: { path: "layouts.s1.capacity", before: 10, after: 12 },
      names: { s1: "Boardroom" },
    });
    expect(described.segments).toEqual([
      { kind: "field", key: "layouts" },
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

describe("settings in the change table", () => {
  it("shows switches as yes or no and the fiscal year as a month", () => {
    const join = describeFieldChange({
      change: { path: "domainJoin", before: true, after: false },
      names: {},
    });
    expect(join.before).toEqual({ kind: "yesNo", value: true });
    expect(join.after).toEqual({ kind: "yesNo", value: false });
  });

  it("leaves a new record's bookkeeping out, but keeps it on an update", () => {
    const fields = [
      { path: "vocabularyId", after: "v1" },
      { path: "name", after: "Selleri" },
      { path: "position", after: 3 },
      { path: "status", after: "ACTIVE" },
    ];
    const base = { entityType: "vocabularyValue", entityId: "x", name: "Selleri" };
    const created = visibleFields({ change: { ...base, kind: "create", fields } });
    expect(created.map((field) => field.path)).toEqual(["vocabularyId", "name"]);
    const updated = visibleFields({ change: { ...base, kind: "update", fields } });
    expect(updated).toHaveLength(4);
  });
});
