import { describe, expect, it } from "vitest";
import type { IntakeData } from "../load-intake-data";
import type { CatalogItem } from "./catalog";
import { at } from "./line-fixture";
import { slotLines } from "./slot-lines";

const room: CatalogItem = {
  ...{ id: "room1", name: "Vinga", typeName: "Room", capabilities: ["BOOKABLE"], timeZone: "UTC" },
  ...{ priceMinor: null, priceUnit: null, defaultDurationMinutes: 60, layouts: [] },
  ...{ maxPeople: null, groups: [] },
};
const period = { startsAt: at({ hour: 9 }), endsAt: at({ hour: 12 }) };
const slot = { itemId: "room1", date: "2026-11-20", from: "09:00", to: "12:00" };

const dataWith = ({ withSlot = true, items = [room], lineTypes = [{ id: "lt" }] } = {}) =>
  ({
    slot: withSlot ? slot : null,
    catalog: { items, lineTypes },
  }) as unknown as Pick<IntakeData, "slot" | "catalog">;

const newKey = () => "k1";

describe("slotLines", () => {
  it("starts a custom booking with the resource over the whole period", () => {
    const lines = slotLines({ data: dataWith(), period, newKey });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      key: "k1",
      itemId: "room1",
      name: "Vinga",
      entityTypeId: "lt",
    });
    expect([lines[0]?.startsAt, lines[0]?.endsAt]).toEqual([
      at({ hour: 9 }).toISOString(),
      at({ hour: 12 }).toISOString(),
    ]);
  });

  it("is empty without a slot, the item in the catalog or a line type", () => {
    expect(slotLines({ data: dataWith({ withSlot: false }), period, newKey })).toEqual([]);
    expect(slotLines({ data: dataWith({ items: [] }), period, newKey })).toEqual([]);
    expect(slotLines({ data: dataWith({ lineTypes: [] }), period, newKey })).toEqual([]);
  });
});
