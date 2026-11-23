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

  it("sends one own field by its key, cleared with null when emptied", () => {
    const withField = { ...values, fields: { floor: 2, view: "River" } };
    const input = toUpdateInput({
      item,
      values: withField,
      type: undefined,
      groups: ["field"],
      fieldKey: "floor",
    });
    expect(input).toEqual({ id: "i1", fields: { floor: 2 } });
    const cleared = toUpdateInput({
      item,
      values,
      type: undefined,
      groups: ["field"],
      fieldKey: "floor",
    });
    expect(cleared).toEqual({ id: "i1", fields: { floor: null } });
  });

  it("sends one setting at a time and leaves out keys the type does not have", () => {
    const input = toUpdateInput({ item, values, type: undefined, groups: ["teardown"] });
    expect(input).toEqual({ id: "i1", teardownMinutes: 15 });
    const duration = toUpdateInput({ item, values, type: undefined, groups: ["duration"] });
    expect(duration).toEqual({ id: "i1" });
  });
});
