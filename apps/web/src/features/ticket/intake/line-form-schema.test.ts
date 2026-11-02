import { describe, expect, it } from "vitest";
import type { CatalogItem } from "./catalog";
import { lineFormSchema, toDraftLine } from "./line-form-schema";
import { lineFormDefaults } from "./line-form-values";

const item: CatalogItem = {
  ...{ id: "i1", name: "Lunch", typeName: "Food", capabilities: ["CUSTOMISATIONS", "PRICED"] },
  ...{ timeZone: "UTC", priceMinor: 25_000, defaultDurationMinutes: null, setups: [] },
  groups: [
    {
      ...{ name: "Main", minPick: 1, maxPick: 2, split: true },
      options: [
        { itemId: "fish", name: "Fish", priceEffect: "INCLUDED" },
        { itemId: "veg", name: "Veg", priceEffect: "INCLUDED" },
      ],
    },
  ],
};

const schema = lineFormSchema({
  ...{ type: undefined, vocabularies: [], item, date: "2026-11-20", timeZone: "UTC" },
  needTypeId: "rt",
});
const values = {
  ...lineFormDefaults({ line: null, item, type: undefined, timeZone: "UTC", period: null }),
  entityTypeId: "lt",
};

describe("lineFormSchema", () => {
  it("turns the dialog into a draft line: times on the day, split choices and needs", () => {
    const raw = {
      ...values,
      ...{ from: "12:00", to: "13:00", quantity: "", unitPrice: "199.5" },
      groups: [{ picked: [], quantities: { fish: "8", veg: "0" } }],
      needs: [{ valueId: "vegan", count: "2" }],
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) throw parsed.error;
    expect(toDraftLine({ line: parsed.data, key: "k" })).toMatchObject({
      ...{ name: "Lunch", itemId: "i1", quantity: null, unitPriceMinor: 19_950 },
      startsAt: "2026-11-20T12:00:00.000Z",
      options: [{ itemId: "fish", quantity: 8 }],
      needs: [{ entityTypeId: "rt", vocabularyValueId: "vegan", quantity: 2 }],
    });
  });

  it("refuses a lone time and keeps both empty untimed", () => {
    expect(schema.safeParse({ ...values, from: "12:00" }).success).toBe(false);
    const untimed = schema.safeParse(values);
    expect(untimed.success && untimed.data.startsAt).toBeNull();
  });
});
