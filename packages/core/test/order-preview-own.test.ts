import { describe, expect, it } from "vitest";
import { createLayout, execute, updateItem } from "../src/index";
import { unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";
import { draftLine, preview, previewSetup, runPreview } from "./preview-helpers";

describe("order.previewLines: the draft itself (ADR 0081)", () => {
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

  it("reports a quantity above the layout's capacity, following the headcount", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    const input = { itemId: room.id, name: "Theatre", capacity: 10 };
    const theatre = unwrap({ result: await execute({ operation: createLayout, input, context }) });
    const line = { ...draftLine({ setup, from: 9, to: 11 }), layoutId: theatre.id };
    const over = await preview({ setup, input: { headcount: 12, lines: [line] } });
    expect(over.entries[0]?.lines[0]).toMatchObject({
      layoutId: theatre.id,
      effectiveQuantity: 12,
      quantitySource: "ESTIMATED_HEADCOUNT",
      issues: [expect.objectContaining({ kind: "LAYOUT_CAPACITY", capacity: 10 })],
    });
    const fixed = await preview({
      setup,
      input: { headcount: 12, lines: [{ ...line, quantity: 8 }] },
    });
    expect(fixed.entries[0]?.lines[0]?.issues).toEqual([]);
  });

  it("reports more people than the room's limit as MAX_PEOPLE before it is saved", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    const limit = { id: room.id, maxPeople: 20 };
    unwrap({ result: await execute({ operation: updateItem, input: limit, context }) });
    const line = draftLine({ setup, from: 9, to: 11 });
    const over = await preview({ setup, input: { headcount: 25, lines: [line] } });
    expect(over.entries[0]?.lines[0]?.issues).toEqual([
      expect.objectContaining({ kind: "MAX_PEOPLE", capacity: 20 }),
    ]);
    const within = await preview({ setup, input: { headcount: 20, lines: [line] } });
    expect(within.entries[0]?.lines[0]?.issues).toEqual([]);
  });

  it("refuses a layout of another item", async () => {
    const setup = await previewSetup();
    const line = { ...draftLine({ setup, from: 9, to: 11 }), layoutId: "no-such-layout" };
    const input = { customerId: setup.customerId, ...hours({ from: 9, to: 13 }), headcount: 8 };
    const result = await runPreview({ context: setup.context, input: { ...input, lines: [line] } });
    expect(result.ok ? null : result.error.issues.map((issue) => issue.path)).toEqual([
      "lines.0.layoutId",
    ]);
  });
});
