import { describe, expect, it } from "vitest";
import { createOccupancy, execute } from "../src/index";
import { unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";
import { draftLine, preview, previewSetup } from "./preview-helpers";

describe("order.previewLines: manual blocks (ADR 0081)", () => {
  it("reports a manual block as HARD_CLASH without an order reference", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    const block = { itemId: room.id, type: "MAINTENANCE" as const, ...hours({ from: 9, to: 10 }) };
    unwrap({ result: await execute({ operation: createOccupancy, input: block, context }) });
    const result = await preview({
      setup,
      input: { lines: [draftLine({ setup, from: 9, to: 11 })] },
    });
    expect(result.entries[0]?.lines[0]?.issues).toEqual([
      expect.objectContaining({ kind: "HARD_CLASH", orderReference: null, refusesCreate: false }),
    ]);
    expect(result.entries[0]?.group).toBe("CLASHES");
  });
});
