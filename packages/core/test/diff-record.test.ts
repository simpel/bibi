import { describe, expect, it } from "vitest";
import { diffRecord } from "../src/change-preview/diff-record";

describe("diffRecord (ADR 0049)", () => {
  it("lists only changed fields and skips bookkeeping", () => {
    const before = { id: "a", name: "Linnea", updatedAt: new Date(1), priceMinor: 100 };
    const after = { id: "a", name: "Linnea", updatedAt: new Date(2), priceMinor: 200 };
    expect(diffRecord({ before, after })).toEqual([
      { path: "priceMinor", before: 100, after: 200 },
    ]);
  });

  it("walks nested fields and keys array entries by their id", () => {
    const before = { fields: { seats: 10 }, setups: [{ setupId: "s1", capacity: 10 }] };
    const after = {
      fields: { seats: 12 },
      setups: [
        { setupId: "s1", capacity: 10 },
        { setupId: "s2", capacity: 30 },
      ],
    };
    expect(diffRecord({ before, after })).toEqual([
      { path: "fields.seats", before: 10, after: 12 },
      { path: "setups.s2.capacity", before: undefined, after: 30 },
    ]);
  });

  it("treats a new record as every field going from nothing", () => {
    expect(diffRecord({ after: { name: "Concert hall" } })).toEqual([
      { path: "name", before: undefined, after: "Concert hall" },
    ]);
  });
});
