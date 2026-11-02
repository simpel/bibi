import { describe, expect, it } from "vitest";
import { at, draftFixture, previewLineFixture } from "./line-fixture";
import { reviewRows } from "./review-rows";

const addOn = { itemId: "oat", name: "Oat ball", quantity: null, unitPriceMinor: null };

describe("reviewRows", () => {
  it("nests each add-on under its line with the line's time and quantity unless its own", () => {
    const own = {
      ...addOn,
      key: "b",
      quantity: 3,
      startsAt: at({ hour: 10 }).toISOString(),
      endsAt: at({ hour: 11 }).toISOString(),
    };
    const line = draftFixture({
      key: "l1",
      from: 9,
      to: 12,
      quantity: 8,
      addOns: [{ ...addOn, key: "a", startsAt: null, endsAt: null }, own],
    });
    const planned = [
      previewLineFixture({
        addOns: [previewLineFixture({ name: "Oat ball" }), previewLineFixture({ name: "Late" })],
      }),
    ];
    const rows = reviewRows({
      ...{ lines: [line], planned, headcount: 12, items: [], needValues: [] },
      timeRange: ({ start, end }) =>
        `${new Date(start).getUTCHours()}-${new Date(end).getUTCHours()}`,
    });
    expect(rows.map((row) => [row.key, row.name, row.quantity, row.follows, row.time])).toEqual([
      ["l1", "Room", 8, 12, "9-12"],
      ["l1:a", "Oat ball", null, 8, "9-12"],
      ["l1:b", "Oat ball", 3, 8, "10-11"],
    ]);
    expect(rows[2]?.planned?.name).toBe("Late");
    expect(rows[1]?.details).toBeNull();
  });
});
