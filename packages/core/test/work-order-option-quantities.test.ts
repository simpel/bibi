import { describe, expect, it } from "vitest";
import { createItem, execute, generateWorkOrder } from "../src/index";
import { unwrap } from "./helpers";
import { createTestLine } from "./line-helpers";
import { choose } from "./line-options-helpers";
import { confirmTicket } from "./work-order-helpers";
import { matchSetup } from "./work-order-match-helpers";

describe("work orders list option lines with their quantities (ADR 0082)", () => {
  it("lists each option of a split group with its own quantity", async () => {
    const setup = await matchSetup();
    const { context, ticket, morning, menus, definition } = setup;
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
        ...{ context, ticketId: ticket.id, entityTypeId: morning.entityTypeId },
        ...{ itemId: dinner.id, from: 16, to: 17 },
      }),
    });
    const chosen = [
      { itemId: menus.mandatory, quantity: 10 },
      { itemId: menus.plain, quantity: 4 },
    ];
    unwrap({ result: await choose({ context, lineId: line.id, options: chosen }) });
    await confirmTicket({ context, ticketId: ticket.id });
    const workOrder = unwrap({
      result: await execute({
        operation: generateWorkOrder,
        input: { ticketId: ticket.id, workOrderDefinitionId: definition.id },
        context,
      }),
    });
    const items = workOrder.content.rows.filter((row) => row.kind === "ITEM");
    expect(items.map((row) => [row.itemName, row.quantity])).toEqual(
      expect.arrayContaining([
        ["Mandatory", 10],
        ["Plain", 4],
      ]),
    );
    expect(items.map((row) => row.itemName)).not.toContain("Dinner");
  });
});
