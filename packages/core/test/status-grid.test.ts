import { describe, expect, it } from "vitest";
import { archiveItemState, archiveTicketStatus, execute, getStatusGrid } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { toState } from "./item-state-helpers";
import { activeOccupancies } from "./line-helpers";
import { addLine, follow, gridSetup, lineNow, setCell } from "./status-grid-helpers";
import { moveToStatus } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

describe("statusGrid.get and statusGrid.setCell (ADR 0044)", () => {
  it("sets, replaces and clears a cell and lists only set cells", async () => {
    const { context, room, roomState } = await gridSetup();
    const cell = { context, ticketStatus: "Confirmed", entityTypeId: room.entityTypeId };
    unwrap({ result: await setCell({ ...cell, stateId: roomState.prebooked.id }) });
    const grid = unwrap({ result: await setCell({ ...cell, stateId: roomState.booked.id }) });
    expect(grid.cells).toMatchObject([{ stateId: roomState.booked.id, stateName: "Booked" }]);
    const cleared = unwrap({ result: await setCell({ ...cell, stateId: null }) });
    expect(cleared.cells).toEqual([]);
    const all = unwrap({ result: await execute({ operation: getStatusGrid, input: {}, context }) });
    expect(all.cells).toEqual([]);
  });

  it("refuses a closing status, a non-item type and a state of another type", async () => {
    const { context, room, roomState, food, lineType } = await gridSetup();
    const cases = [
      { ticketStatus: "Lost", entityTypeId: room.entityTypeId, stateId: roomState.booked.id },
      { ticketStatus: "Lead", entityTypeId: lineType.id, stateId: null },
      { ticketStatus: "Lead", entityTypeId: room.entityTypeId, stateId: food.ordered.id },
    ];
    for (const input of cases) {
      expect(errorCode({ result: await setCell({ context, ...input }) })).toBe("VALIDATION");
    }
  });
});

describe("new lines and line.followStatus (ADR 0044)", () => {
  it("starts a new line in the current status's cell, else in the initial state", async () => {
    const setup = await gridSetup();
    const { context, food, room, roomState } = setup;
    const cell = { entityTypeId: food.type.id, stateId: food.ordered.id };
    unwrap({ result: await setCell({ context, ticketStatus: "Lead", ...cell }) });
    const ticket = await setup.newTicket();
    const dish = await addLine({ setup, ticketId: ticket.id, itemId: food.dish.id });
    const hall = await addLine({ setup, ticketId: ticket.id, itemId: room.id });
    expect([dish.stateId, hall.stateId]).toEqual([food.ordered.id, roomState.prebooked.id]);
  });

  it("clears an override and applies the current cell; an empty cell keeps the state", async () => {
    const setup = await gridSetup();
    const { context, food } = setup;
    const ticket = await setup.newTicket();
    const line = await addLine({ setup, ticketId: ticket.id, itemId: food.dish.id });
    unwrap({ result: await toState({ context, lineId: line.id, stateId: food.ordered.id }) });
    const kept = unwrap({ result: await follow({ context, lineId: line.id }) });
    expect(kept).toMatchObject({ stateId: food.ordered.id, stateOverridden: false });
    unwrap({ result: await toState({ context, lineId: line.id, stateId: food.ordered.id }) });
    const cell = { entityTypeId: food.type.id, stateId: food.locked.id };
    unwrap({ result: await setCell({ context, ticketStatus: "Lead", ...cell }) });
    const moved = unwrap({ result: await follow({ context, lineId: line.id }) });
    expect(moved).toMatchObject({ stateId: food.locked.id, stateOverridden: false });
  });

  it("refuses to follow a cell the type's transitions forbid", async () => {
    const setup = await gridSetup();
    const { context, food } = setup;
    const ticket = await setup.newTicket();
    const line = await addLine({ setup, ticketId: ticket.id, itemId: food.dish.id });
    unwrap({ result: await toState({ context, lineId: line.id, stateId: food.locked.id }) });
    const cell = { entityTypeId: food.type.id, stateId: food.ordered.id };
    unwrap({ result: await setCell({ context, ticketStatus: "Lead", ...cell }) });
    expect(errorCode({ result: await follow({ context, lineId: line.id }) })).toBe("CONFLICT");
    expect(await lineNow({ context, lineId: line.id })).toMatchObject({ stateOverridden: true });
  });
});

describe("closing statuses and the grid's lifecycle (ADR 0044)", () => {
  it("releases every line on a closing status, overrides and grid ignored", async () => {
    const setup = await gridSetup();
    const { context, room, roomState, food } = setup;
    const ticket = await setup.newTicket();
    const hall = await addLine({ setup, ticketId: ticket.id, itemId: room.id });
    const dish = await addLine({ setup, ticketId: ticket.id, itemId: food.dish.id });
    unwrap({ result: await toState({ context, lineId: dish.id, stateId: food.ordered.id }) });
    const reason = "Budget";
    unwrap({ result: await moveToStatus({ context, ticketId: ticket.id, name: "Lost", reason }) });
    expect((await lineNow({ context, lineId: hall.id })).stateId).toBe(roomState.released.id);
    expect(await activeOccupancies({ context, lineId: hall.id })).toEqual([]);
    expect((await lineNow({ context, lineId: dish.id })).stateId).toBe(food.released.id);
  });

  it("moves cells with an archived state and clears an archived status's cells", async () => {
    const { context, room, roomState } = await gridSetup();
    const cell = { entityTypeId: room.entityTypeId, stateId: roomState.prebooked.id };
    unwrap({ result: await setCell({ context, ticketStatus: "Confirmed", ...cell }) });
    const input = { id: roomState.booked.id, targetStateId: roomState.prebooked.id };
    unwrap({ result: await setCell({ context, ticketStatus: "Lead", ...cell }) });
    unwrap({
      result: await setCell({ context, ticketStatus: "Lead", ...cell, stateId: input.id }),
    });
    unwrap({ result: await execute({ operation: archiveItemState, input, context }) });
    const grid = unwrap({
      result: await execute({ operation: getStatusGrid, input: {}, context }),
    });
    expect(grid.cells.map((row) => row.stateId)).toEqual([cell.stateId, cell.stateId]);
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const archive = { id: confirmed.id };
    unwrap({ result: await execute({ operation: archiveTicketStatus, input: archive, context }) });
    expect(await context.db.statusStateRule.count({ where: { statusId: confirmed.id } })).toBe(0);
  });
});
