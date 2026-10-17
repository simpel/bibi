import { describe, expect, it } from "vitest";
import { parseTableOrders, tableColumnsKey } from "./table-preferences";

describe("table preferences", () => {
  it("builds the key for a table", () => {
    expect(tableColumnsKey({ tableId: "booking" })).toBe("table.columns.booking");
  });

  it("returns saved orders by table id and ignores everything else", () => {
    const orders = parseTableOrders({
      preferences: {
        "table.columns.booking": ["customer", "title"],
        "table.columns.venue": "name",
        "table.columns.item": [1, 2],
        "sidebar.collapsed": true,
      },
    });
    expect(orders).toEqual({ booking: ["customer", "title"] });
  });
});
