import { describe, expect, it } from "vitest";
import { createItemDemand, execute, getLine, listLines, updateItemDemand } from "../src/index";
import { avSetup } from "./allocation-helpers";
import { unwrap } from "./helpers";
import { createTestLine } from "./line-helpers";

type Setup = Awaited<ReturnType<typeof avSetup>>;

async function bookRoomWithOptionalAv({ setup }: { setup: Setup }) {
  const { context } = setup;
  const input = {
    itemId: setup.room.id,
    entityTypeId: setup.av.type.id,
    windows: ["BOOKING"] as const,
    required: false,
    quantity: 4,
  };
  const demand = unwrap({ result: await execute({ operation: createItemDemand, input, context }) });
  const line = unwrap({
    result: await createTestLine({
      context,
      ticketId: setup.ticket.id,
      entityTypeId: setup.type.id,
      itemId: setup.room.id,
      from: 10,
      to: 12,
    }),
  });
  return { line, demand };
}

describe("derived line warnings (ADR 0059)", () => {
  it("unfilled optional demands warn on get and list and clear when filled", async () => {
    const setup = await avSetup();
    const { context } = setup;
    const { line, demand } = await bookRoomWithOptionalAv({ setup });
    // Four AV units wanted, three exist and the chained technician pool of two covers two.
    const warned = unwrap({
      result: await execute({ operation: getLine, input: { id: line.id }, context }),
    });
    expect(warned.warnings.map((warning) => warning.kind)).toEqual([
      "UNFILLED_OPTIONAL_DEMAND",
      "UNFILLED_OPTIONAL_DEMAND",
    ]);
    const listed = unwrap({
      result: await execute({
        operation: listLines,
        input: { ticketId: setup.ticket.id },
        context,
      }),
    });
    expect(listed.items.find((row) => row.id === line.id)?.warnings).toEqual(warned.warnings);
    const fewer = { id: demand.id, quantity: 2 };
    unwrap({ result: await execute({ operation: updateItemDemand, input: fewer, context }) });
    const filled = unwrap({
      result: await execute({ operation: getLine, input: { id: line.id }, context }),
    });
    expect(filled.warnings).toEqual([]);
  });

  it("a mandatory demand never warns", async () => {
    const setup = await avSetup();
    const line = unwrap({
      result: await createTestLine({
        context: setup.context,
        ticketId: setup.ticket.id,
        entityTypeId: setup.type.id,
        itemId: setup.av.ids[0],
        from: 10,
        to: 12,
      }),
    });
    expect(line.warnings).toEqual([]);
  });
});
