import { describe, expect, it } from "vitest";
import type { CatalogItem } from "./catalog";
import { at } from "./line-fixture";
import { quickLine } from "./quick-line";

const item = ({ ...input }: Partial<CatalogItem>): CatalogItem => ({
  ...{ id: "i1", name: "Vinga", typeName: "Room", capabilities: [], timeZone: "UTC" },
  ...{ priceMinor: null, defaultDurationMinutes: null, setups: [], groups: [] },
  ...input,
});
const period = { startsAt: at({ hour: 9 }), endsAt: at({ hour: 12 }) };

describe("quickLine", () => {
  it("times a bookable item from the start for its default length, else to the end", () => {
    const room = quickLine({
      item: item({ capabilities: ["BOOKABLE"], defaultDurationMinutes: 60 }),
      lineTypeId: "lt",
      period,
      key: "k",
    });
    expect([room.startsAt, room.endsAt]).toEqual([
      at({ hour: 9 }).toISOString(),
      at({ hour: 10 }).toISOString(),
    ]);
    const hall = quickLine({
      item: item({ capabilities: ["BOOKABLE"] }),
      lineTypeId: "lt",
      period,
      key: "k",
    });
    expect(hall.endsAt).toBe(at({ hour: 12 }).toISOString());
  });

  it("leaves any other item untimed, one per guest", () => {
    const coffee = quickLine({
      item: item({ capabilities: ["PRICED"] }),
      lineTypeId: "lt",
      period,
      key: "k",
    });
    expect(coffee).toMatchObject({ startsAt: null, endsAt: null, quantity: null, name: "Vinga" });
  });
});
