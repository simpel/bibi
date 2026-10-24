import { describe, expect, it } from "vitest";
import {
  execute,
  importStatusGridTemplate,
  importTicketStatusTemplate,
  provisionOrganization,
} from "../src/index";
import { FALLBACK_TIME_ZONE } from "../src/time/time-zone";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { addLine, gridSetup, lineNow, setCell } from "./status-grid-helpers";
import { moveToStatus } from "./ticket-helpers";

const estate = { template: "conference-estate" } as const;

async function importBoth({
  context,
}: {
  context: Awaited<ReturnType<typeof gridSetup>>["context"];
}) {
  const statuses = { operation: importTicketStatusTemplate, input: estate, context };
  unwrap({ result: await execute(statuses) });
  return unwrap({
    result: await execute({ operation: importStatusGridTemplate, input: estate, context }),
  });
}

describe("statusGrid.importTemplate (ADR 0044)", () => {
  it("fills the cells by state name, keeps set cells and is idempotent", async () => {
    const { context, room, roomState, food } = await gridSetup();
    const kept = { context, ticketStatus: "Confirmed", entityTypeId: room.entityTypeId };
    unwrap({ result: await setCell({ ...kept, stateId: roomState.prebooked.id }) });
    const first = await importBoth({ context });
    const of = ({ typeId }: { typeId: string }) =>
      first.grid.cells
        .filter((cell) => cell.entityTypeId === typeId)
        .map((cell) => `${cell.statusName}:${cell.stateName}`);
    expect(of({ typeId: room.entityTypeId })).toEqual([
      "Confirmed:Prebooked",
      "New:Prebooked",
      "Site visit:Prebooked",
      "Quote sent:Prebooked",
    ]);
    expect(of({ typeId: food.type.id })).toEqual([
      "Confirmed:Ordered",
      "New:Estimated",
      "Site visit:Estimated",
      "Quote sent:Estimated",
      "Final count locked:Locked",
    ]);
    expect(first.applied).toBe(first.grid.cells.length - 1);
    const second = unwrap({
      result: await execute({ operation: importStatusGridTemplate, input: estate, context }),
    });
    expect(second.applied).toBe(0);
  });

  it("books a room and orders food when a ticket enters Confirmed", async () => {
    const setup = await gridSetup();
    const { context, room, roomState, food } = setup;
    await importBoth({ context });
    const ticket = await setup.newTicket();
    const hall = await addLine({ setup, ticketId: ticket.id, itemId: room.id });
    const dish = await addLine({ setup, ticketId: ticket.id, itemId: food.dish.id });
    unwrap({ result: await moveToStatus({ context, ticketId: ticket.id, name: "Confirmed" }) });
    expect((await lineNow({ context, lineId: hall.id })).stateId).toBe(roomState.booked.id);
    expect((await lineNow({ context, lineId: dish.id })).stateId).toBe(food.ordered.id);
  });

  it("needs statusGrid:admin and sets nothing in an organization without types", async () => {
    const context = testContext();
    unwrap({
      result: await provisionOrganization({
        organizationId: context.organizationId,
        timeZone: FALLBACK_TIME_ZONE,
      }),
    });
    const result = unwrap({
      result: await execute({
        operation: importStatusGridTemplate,
        input: { template: "default" },
        context,
      }),
    });
    expect(result).toEqual({ applied: 0, grid: { cells: [] } });
    const viewer = peer({ of: context, access: "read" });
    const refused = await execute({
      operation: importStatusGridTemplate,
      input: { template: "default" },
      context: viewer,
    });
    expect(errorCode({ result: refused })).toBe("FORBIDDEN");
  });
});
