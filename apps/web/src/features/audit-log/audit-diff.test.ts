import { describe, expect, it } from "vitest";
import { auditDiff, formatAuditValue } from "./audit-diff";

describe("auditDiff", () => {
  it("lists only changed fields and skips bookkeeping", () => {
    const before = { id: "v1", name: "Old", city: "Göteborg", updatedAt: "a" };
    const after = { id: "v1", name: "New", city: "Göteborg", updatedAt: "b" };
    expect(auditDiff({ before, after })).toEqual([{ field: "name", before: "Old", after: "New" }]);
  });

  it("shows the set fields of a create and compares nested values", () => {
    expect(auditDiff({ before: null, after: { name: "Hall", description: null } })).toEqual([
      { field: "name", before: undefined, after: "Hall" },
    ]);
    const nested = auditDiff({ before: { fields: { a: [1] } }, after: { fields: { a: [2] } } });
    expect(nested.map((change) => change.field)).toEqual(["fields"]);
  });
});

describe("formatAuditValue", () => {
  it("formats empty values, strings and JSON", () => {
    expect(formatAuditValue({ value: null })).toBe("–");
    expect(formatAuditValue({ value: "Hall" })).toBe("Hall");
    expect(formatAuditValue({ value: { a: 1 } })).toBe('{"a":1}');
  });
});
