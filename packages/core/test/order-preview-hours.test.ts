import { describe, expect, it } from "vitest";
import { unwrap } from "./helpers";
import { OFFICE_DAYS, runItemHours } from "./hours-helpers";
import { draftLine, preview, previewSetup } from "./preview-helpers";

describe("order.previewLines: hours (ADR 0064, 0081)", () => {
  it("reports OUTSIDE_HOURS from the item's own working hours", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    unwrap({ result: await runItemHours({ context, itemId: room.id, days: OFFICE_DAYS }) });
    // 1 November 2037 is a Sunday: outside Monday–Friday office hours.
    const result = await preview({
      setup,
      input: { lines: [draftLine({ setup, from: 9, to: 11 })] },
    });
    expect(result.entries[0]?.lines[0]?.issues).toEqual([
      expect.objectContaining({
        kind: "OUTSIDE_HOURS",
        hoursKind: "OUTSIDE_ITEM_HOURS",
        hoursOwnerId: room.id,
      }),
    ]);
  });
});
