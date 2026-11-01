import { describe, expect, it } from "vitest";
import { createSetup, execute, updateItem } from "../src/index";
import { unwrap } from "./helpers";
import { draftLine, preview, previewSetup } from "./preview-helpers";

describe("ticket.previewLines: the draft itself (ADR 0081)", () => {
  it("reports two draft lines on the same room at once as SELF_OVERLAP", async () => {
    const setup = await previewSetup();
    const lines = [
      draftLine({ setup, from: 9, to: 11 }),
      draftLine({ setup, from: 10, to: 12 }),
      draftLine({ setup, from: 11, to: 12, itemId: setup.food.dish.id }),
    ];
    const result = await preview({ setup, input: { lines } });
    const issues = result.entries[0]?.lines.map((line) =>
      line.issues.map((issue) => [issue.kind, issue.otherLineIndex]),
    );
    expect(issues).toEqual([[["SELF_OVERLAP", 1]], [["SELF_OVERLAP", 0]], []]);
  });

  it("reports a quantity above the setup's capacity, following the headcount", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    const theatre = unwrap({
      result: await execute({ operation: createSetup, input: { name: "Theatre" }, context }),
    });
    const setups = [{ setupId: theatre.id, capacity: 10 }];
    unwrap({
      result: await execute({ operation: updateItem, input: { id: room.id, setups }, context }),
    });
    const line = { ...draftLine({ setup, from: 9, to: 11 }), setupId: theatre.id };
    const over = await preview({ setup, input: { headcount: 12, lines: [line] } });
    expect(over.entries[0]?.lines[0]).toMatchObject({
      effectiveQuantity: 12,
      quantitySource: "ESTIMATED_HEADCOUNT",
      issues: [expect.objectContaining({ kind: "SETUP_CAPACITY", capacity: 10 })],
    });
    const fixed = await preview({
      setup,
      input: { headcount: 12, lines: [{ ...line, quantity: 8 }] },
    });
    expect(fixed.entries[0]?.lines[0]?.issues).toEqual([]);
  });
});
