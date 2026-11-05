import { describe, expect, it } from "vitest";
import { createItem, execute, generateRunSheet } from "../src/index";
import { unwrap } from "./helpers";
import { createTestLine } from "./line-helpers";
import { choose } from "./line-options-helpers";
import { confirmOrder } from "./run-sheet-helpers";
import { matchSetup } from "./run-sheet-match-helpers";

describe("run sheets list option lines with their quantities (ADR 0082)", () => {
  it("lists each option of a split group with its own quantity", async () => {
    const setup = await matchSetup();
    const { context, order, morning, menus, definition } = setup;
    const options = [menus.mandatory, menus.plain].map((itemId) => ({
      ...{ itemId, priceEffect: "INCLUDED" as const },
    }));
    const group = { name: "Main course", minPick: 1, maxPick: 2, split: true, options };
    const input = { entityTypeId: definition.entityTypeIds[0] ?? "", name: "Dinner" };
    const dinner = unwrap({
      result: await execute({
        operation: createItem,
        input: { ...input, customisationGroups: [group] },
        context,
      }),
    });
    const line = unwrap({
      result: await createTestLine({
        ...{ context, orderId: order.id, entityTypeId: morning.entityTypeId },
        ...{ itemId: dinner.id, from: 16, to: 17 },
      }),
    });
    const chosen = [
      { itemId: menus.mandatory, quantity: 10 },
      { itemId: menus.plain, quantity: 4 },
    ];
    unwrap({ result: await choose({ context, lineId: line.id, options: chosen }) });
    await confirmOrder({ context, orderId: order.id });
    const runSheet = unwrap({
      result: await execute({
        operation: generateRunSheet,
        input: { orderId: order.id, runSheetDefinitionId: definition.id },
        context,
      }),
    });
    const items = runSheet.content.rows.filter((row) => row.kind === "ITEM");
    expect(items.map((row) => [row.itemName, row.quantity])).toEqual(
      expect.arrayContaining([
        ["Mandatory", 10],
        ["Plain", 4],
      ]),
    );
    expect(items.map((row) => row.itemName)).not.toContain("Dinner");
  });
});
