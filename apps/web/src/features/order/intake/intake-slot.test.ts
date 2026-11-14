import { describe, expect, it } from "vitest";
import {
  type IntakeSlot,
  packagesWithItem,
  slotDraftKey,
  slotFromSearch,
  slotHref,
  slotWhen,
} from "./intake-slot";
import type { PackageOption } from "./package-groups";

const slot: IntakeSlot = { itemId: "room1", date: "2026-11-20", from: "09:00", to: "12:30" };
const search = { slot: "room1", date: "2026-11-20", from: "09:00", to: "12:30" };

const option = ({ id, itemIds }: { id: string; itemIds: string[] }): PackageOption => ({
  ...{ id, name: id, minGuests: null, maxGuests: null, lineNames: [], itemIds },
  ...{ entityTypeId: "tt", fields: {} },
});

describe("slotFromSearch", () => {
  it("reads the slot from the query", () => {
    expect(slotFromSearch({ search })).toEqual(slot);
  });

  it("ignores a missing, repeated or malformed part", () => {
    expect(slotFromSearch({ search: {} })).toBeNull();
    expect(slotFromSearch({ search: { ...search, slot: undefined } })).toBeNull();
    expect(slotFromSearch({ search: { ...search, slot: ["a", "b"] } })).toBeNull();
    expect(slotFromSearch({ search: { ...search, date: "20/11/2026" } })).toBeNull();
    expect(slotFromSearch({ search: { ...search, from: "9:00" } })).toBeNull();
    expect(slotFromSearch({ search: { ...search, to: "24:00" } })).toBeNull();
  });

  it("refuses equal times but takes a to before from (ends the next day)", () => {
    expect(slotFromSearch({ search: { ...search, to: "09:00" } })).toBeNull();
    expect(slotFromSearch({ search: { ...search, from: "22:00", to: "02:00" } })).not.toBeNull();
  });
});

describe("slotHref", () => {
  it("is read back by slotFromSearch", () => {
    const href = slotHref({ slot });
    expect(href.startsWith("/new/order?")).toBe(true);
    const query = Object.fromEntries(new URLSearchParams(href.split("?")[1]));
    expect(query.itemId).toBeUndefined();
    expect(slotFromSearch({ search: query })).toEqual(slot);
  });
});

describe("slotDraftKey and slotWhen", () => {
  it("keys each slot's draft on its own", () => {
    const key = slotDraftKey({ key: "intake.o.u", slot });
    expect(key).toBe("intake.o.u.slot.room1.2026-11-20.09:00");
    expect(slotDraftKey({ key: "intake.o.u", slot: { ...slot, from: "13:00" } })).not.toBe(key);
  });

  it("fills step 2's day and times, leaving the guests", () => {
    expect(slotWhen({ slot })).toEqual({
      date: "2026-11-20",
      from: "09:00",
      to: "12:30",
      guests: "",
    });
  });
});

describe("packagesWithItem", () => {
  it("keeps only the packages that book the item, in order", () => {
    const packages = [
      option({ id: "a", itemIds: ["room1", "lunch"] }),
      option({ id: "b", itemIds: ["room2"] }),
      option({ id: "c", itemIds: ["room1"] }),
      option({ id: "d", itemIds: [] }),
    ];
    const kept = packagesWithItem({ packages, itemId: "room1" });
    expect(kept.map(({ id }) => id)).toEqual(["a", "c"]);
  });
});
