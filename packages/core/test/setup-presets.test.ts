import { describe, expect, it } from "vitest";
import {
  draftFromPreset,
  draftFromTypes,
} from "../src/features/pipeline-setup/draft-from-templates";
import { execute, previewPipelineSetup } from "../src/index";
import { SETUP_PRESET_KEYS } from "../src/templates/setup-presets/setup-presets";
import { testContext, unwrap } from "./helpers";
import { roomType } from "./pipeline-setup-helpers";

describe("setup presets (ADR 0061)", () => {
  it.each(SETUP_PRESET_KEYS)("the %s draft previews as ready", async (key) => {
    const context = testContext();
    const input = draftFromPreset({ key, existingTypes: [] });
    const preview = unwrap({
      result: await execute({ operation: previewPipelineSetup, input, context }),
    });
    expect(preview.problems.filter((problem) => problem.severity === "error")).toEqual([]);
    expect(preview.ready).toBe(true);
  });

  it("keeps existing types and adds only the missing ones", async () => {
    const context = testContext();
    const room = await roomType({ context });
    const existingTypes = [{ id: room.id, name: "Room", bookable: true }];
    const draft = draftFromPreset({ key: "restaurant", existingTypes });
    expect(draft.itemTypes.map((type) => type.name)).toEqual([
      "Room",
      "Private room",
      "Set menu",
      "Dish",
      "Drink",
      "Wine package",
    ]);
    expect(draft.itemTypes[0]?.entityTypeId).toBe(room.id);
    const result = await execute({ operation: previewPipelineSetup, input: draft, context });
    expect(unwrap({ result }).ready).toBe(true);
  });

  it("builds a ready draft from a subset of chosen, translated types", async () => {
    const context = testContext();
    const draft = draftFromTypes({
      phases: "conference-estate",
      types: [
        { name: "Bankettsal", bookable: true },
        { name: "Middagsmeny", bookable: false },
      ],
      existingTypes: [],
    });
    expect(draft.itemTypes.map((type) => type.name)).toEqual(["Bankettsal", "Middagsmeny"]);
    const result = await execute({ operation: previewPipelineSetup, input: draft, context });
    expect(unwrap({ result }).ready).toBe(true);
  });
});
