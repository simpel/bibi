import { getSetupPreset } from "@bibi/core/setup-presets";
import { describe, expect, it } from "vitest";
import { chosenTypes, draftFromKind } from "./setup-draft";

describe("setup draft (ADR 0061)", () => {
  it("prefills the kind's types in the user's language", () => {
    const draft = draftFromKind({
      preset: getSetupPreset({ key: "restaurant" }),
      label: ({ key }) => `sv:${key}`,
    });
    expect(draft.kind).toBe("restaurant");
    expect(
      draft.types.map((type) => [type.name, type.category, type.bookable, type.checked]),
    ).toEqual([
      ["sv:privateRoom", "spaces", true, true],
      ["sv:setMenu", "food", false, true],
      ["sv:dish", "food", false, true],
      ["sv:drink", "food", false, true],
      ["sv:winePackage", "food", false, true],
    ]);
  });

  it("keeps only non-empty named types", () => {
    const draft = draftFromKind({
      preset: getSetupPreset({ key: "museum" }),
      label: (t) => t.name,
    });
    draft.types.push({ key: null, name: "  ", category: "food", bookable: false, checked: true });
    expect(chosenTypes({ draft }).map((type) => type.name)).toEqual([
      "Event space",
      "Guide",
      "Guided tour",
      "Coffee break",
      "Meal",
    ]);
  });
});
