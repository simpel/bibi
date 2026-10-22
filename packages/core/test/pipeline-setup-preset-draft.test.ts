import { describe, expect, it } from "vitest";
import { execute, presetDraftPipelineSetup, previewPipelineSetup } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { roomType } from "./pipeline-setup-helpers";

describe("pipelineSetup.presetDraft (ADR 0045)", () => {
  it("returns a draft that previews as ready and keeps the organization's own types", async () => {
    const context = testContext();
    const room = await roomType({ context });
    const input = { key: "restaurant" as const };
    const draft = unwrap({
      result: await execute({ operation: presetDraftPipelineSetup, input, context }),
    });
    expect(draft.itemTypes.map((type) => type.name)).toEqual([
      "Room",
      "Private room",
      "Set menu",
      "Dish",
      "Drink",
      "Wine package",
    ]);
    expect(draft.itemTypes[0]?.entityTypeId).toBe(room.id);
    const preview = await execute({ operation: previewPipelineSetup, input: draft, context });
    expect(unwrap({ result: preview }).ready).toBe(true);
  });

  it("never includes another organization's item types", async () => {
    const owner = testContext();
    await roomType({ context: owner });
    const other = testContext();
    const input = { key: "empty" as const };
    const draft = unwrap({
      result: await execute({ operation: presetDraftPipelineSetup, input, context: other }),
    });
    expect(draft.itemTypes).toEqual([]);
  });

  it("leaves out existing types for a caller without configuration:read", async () => {
    const owner = testContext();
    await roomType({ context: owner });
    const blind = { ...owner, permissions: { ...owner.permissions, configuration: [] } };
    const input = { key: "empty" as const };
    const draft = unwrap({
      result: await execute({ operation: presetDraftPipelineSetup, input, context: blind }),
    });
    expect(draft.itemTypes).toEqual([]);
  });
});
