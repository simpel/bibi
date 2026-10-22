import { getSetupPreset } from "@bibi/core/setup-presets";
import { describe, expect, it } from "vitest";
import { chosenTypes, draftFromKind } from "./setup-draft";

describe("setup draft (ADR 0061)", () => {
  it("prefills the kind's types in the user's language, all ticked", () => {
    const draft = draftFromKind({
      preset: getSetupPreset({ key: "restaurant" }),
      label: ({ key }) => `sv:${key}`,
    });
    expect(draft.kind).toBe("restaurant");
    expect(draft.types.map((type) => [type.name, type.bookable, type.checked])).toEqual([
      ["sv:privateRoom", true, true],
      ["sv:setMenu", false, true],
      ["sv:dish", false, true],
      ["sv:drink", false, true],
      ["sv:winePackage", false, true],
    ]);
  });

  it("keeps only ticked, named types", () => {
    const draft = draftFromKind({
      preset: getSetupPreset({ key: "museum" }),
      label: (t) => t.name,
    });
    draft.types[0] = { ...draft.types[0], checked: false } as (typeof draft.types)[number];
    draft.types.push({ key: null, name: "  ", bookable: false, checked: true });
    expect(chosenTypes({ draft }).map((type) => type.name)).toEqual([
      "Guide",
      "Guided tour",
      "Coffee break",
      "Meal",
    ]);
  });
});
