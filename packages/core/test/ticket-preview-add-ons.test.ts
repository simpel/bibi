import { describe, expect, it } from "vitest";
import { hours } from "./occupancy-helpers";
import { bookRoom, draftLine, preview, previewSetup, runPreview } from "./preview-helpers";

describe("ticket.previewLines: add-ons under draft lines (ADR 0088)", () => {
  it("returns each add-on under its line with its own price and the line's period and quantity", async () => {
    const setup = await previewSetup();
    const lunch = {
      ...draftLine({ setup, from: 9, to: 11, itemId: setup.food.dish.id }),
      ...{ quantity: 10, unitPriceMinor: 25_000, discountPercent: 10 },
      addOns: [
        { itemId: setup.food.dish.id, name: "Oat ball", unitPriceMinor: 6_500 },
        { name: "Flowers", quantity: 2, unitPriceMinor: 30_000, ...hours({ from: 10, to: 11 }) },
      ],
    };
    const result = await preview({ setup, input: { lines: [lunch] } });
    const [line] = result.entries[0]?.lines ?? [];
    expect(line?.effectiveDiscountPercent).toBe(10);
    expect(line?.addOns.map((addOn) => addOn.index)).toEqual([0, 1]);
    expect(line?.addOns[0]).toMatchObject({
      name: "Oat ball",
      entityTypeId: setup.lineType.id,
      startsAt: lunch.startsAt,
      endsAt: lunch.endsAt,
      effectiveQuantity: 10,
      quantitySource: "PARENT_LINE",
      effectiveUnitPriceMinor: 6_500,
      unitPriceSource: "LINE",
    });
    expect(line?.addOns[0]?.effectiveDiscountPercent).not.toBe(10);
    expect(line?.addOns[1]).toMatchObject({
      ...{ name: "Flowers", effectiveQuantity: 2, quantitySource: "LINE" },
      startsAt: hours({ from: 10, to: 11 }).startsAt,
    });
  });

  it("names a bookable add-on's clash under the add-on and groups the entry as CLASHES", async () => {
    const setup = await previewSetup();
    await bookRoom({ setup, from: 9, hard: true });
    const line = {
      ...draftLine({ setup, from: 9, to: 11, itemId: setup.food.dish.id }),
      addOns: [{ itemId: setup.room.id, name: "Extra room" }],
    };
    const result = await preview({ setup, input: { lines: [line] } });
    const entry = result.entries[0];
    expect(entry?.lines[0]?.issues).toEqual([]);
    expect(entry?.lines[0]?.addOns[0]?.issues.map((issue) => issue.kind)).toEqual(["HARD_CLASH"]);
    expect(entry?.group).toBe("CLASHES");
  });

  it("refuses an add-on with neither a name nor an item at its path", async () => {
    const setup = await previewSetup();
    const line = { ...draftLine({ setup, from: 9, to: 11 }), addOns: [{ quantity: 1 }] };
    const result = await runPreview({
      context: setup.context,
      input: {
        customerId: setup.customerId,
        ...hours({ from: 9, to: 13 }),
        headcount: 8,
        lines: [line],
      },
    });
    expect(result.ok ? [] : result.error.issues.map((issue) => issue.path)).toEqual([
      "lines.0.addOns.0.name",
    ]);
  });
});
