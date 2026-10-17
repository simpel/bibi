import { describe, expect, it } from "vitest";
import { resolveColumnOrder } from "./data-table-order";

const ids = ["select", "title", "status", "date", "actions"];

describe("resolveColumnOrder", () => {
  it("uses the default order without a saved order", () => {
    expect(resolveColumnOrder({ saved: undefined, columnIds: ids })).toEqual(ids);
  });

  it("applies a saved order", () => {
    const saved = ["date", "title", "status"];
    expect(resolveColumnOrder({ saved, columnIds: ids })).toEqual([
      "select",
      "date",
      "title",
      "status",
      "actions",
    ]);
  });

  it("drops unknown ids and duplicates", () => {
    const saved = ["gone", "status", "status", "title", "date"];
    expect(resolveColumnOrder({ saved, columnIds: ids })).toEqual([
      "select",
      "status",
      "title",
      "date",
      "actions",
    ]);
  });

  it("inserts a new column after its default predecessor", () => {
    const columnIds = ["title", "owner", "status", "date"];
    const saved = ["date", "title", "status"];
    expect(resolveColumnOrder({ saved, columnIds })).toEqual(["date", "title", "owner", "status"]);
  });

  it("puts a new first column first", () => {
    const columnIds = ["title", "status"];
    expect(resolveColumnOrder({ saved: ["status"], columnIds })).toEqual(["title", "status"]);
  });

  it("enforces pinned columns even when saved elsewhere", () => {
    const saved = ["actions", "title", "select", "status", "date"];
    const result = resolveColumnOrder({ saved, columnIds: ids });
    expect(result[0]).toBe("select");
    expect(result.at(-1)).toBe("actions");
    expect(result).toHaveLength(ids.length);
  });

  it("omits pinned columns the table does not have", () => {
    expect(resolveColumnOrder({ saved: ["select", "b", "a"], columnIds: ["a", "b"] })).toEqual([
      "b",
      "a",
    ]);
  });
});
