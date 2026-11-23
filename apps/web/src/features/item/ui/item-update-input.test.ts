import type { ItemDto } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { toUpdateInput } from "./item-update-input";

const item = { id: "i1", fields: {} } as unknown as ItemDto;
const values = {
  entityTypeId: "t1",
  name: "Wine tasting",
  description: "Six wines",
  venueId: null,
  icon: "wine",
  imageKey: null,
  priceMinor: 22500,
  priceUnit: "PER_PERSON" as const,
  vatRatePercent: null,
  setupMinutes: null,
  teardownMinutes: 15,
  fields: {},
};

describe("toUpdateInput", () => {
  it("sends only the edited group's properties", () => {
    expect(toUpdateInput({ item, values, type: undefined, groups: ["picture"] })).toEqual({
      id: "i1",
      icon: "wine",
      imageKey: null,
    });
  });

  it("sends the description, venue and own fields together", () => {
    const input = toUpdateInput({ item, values, type: undefined, groups: ["details"] });
    expect(input).toMatchObject({ id: "i1", description: "Six wines", venueId: null });
    expect(input).toHaveProperty("fields");
    expect(input).not.toHaveProperty("name");
  });

  it("leaves out a group's keys the type does not have", () => {
    const input = toUpdateInput({ item, values, type: undefined, groups: ["timing"] });
    expect(input).toEqual({ id: "i1", setupMinutes: null, teardownMinutes: 15 });
  });
});
