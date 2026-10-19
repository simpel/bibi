import { describe, expect, it } from "vitest";
import { unwrap } from "./helpers";
import { toState } from "./item-state-helpers";
import { activeOccupancies } from "./line-helpers";
import { addLine, type GridSetup, gridSetup, lineNow, setCell } from "./phase-grid-helpers";
import { moveToPhase } from "./ticket-helpers";

type RoomState = "prebooked" | "booked" | "released";
type DishState = "estimated" | "ordered" | "locked";

type Case = {
  name: string;
  /** Cells of Confirmed; null = empty ("keep"). */
  roomCell: RoomState | null;
  dishCell: DishState | null;
  /** The dish line is overridden to this state before the move. */
  dishOverride?: DishState;
  room: RoomState;
  dish: DishState;
  hold: "SOFT" | "HARD";
};

const CASES: Case[] = [
  {
    name: "both cells set",
    roomCell: "booked",
    dishCell: "locked",
    room: "booked",
    dish: "locked",
    hold: "HARD",
  },
  {
    name: "an empty cell keeps the state",
    roomCell: "booked",
    dishCell: null,
    room: "booked",
    dish: "estimated",
    hold: "HARD",
  },
  {
    name: "no cells at all",
    roomCell: null,
    dishCell: null,
    room: "prebooked",
    dish: "estimated",
    hold: "SOFT",
  },
  {
    name: "a cell equal to the state",
    roomCell: "prebooked",
    dishCell: "estimated",
    room: "prebooked",
    dish: "estimated",
    hold: "SOFT",
  },
  {
    name: "an override survives the move",
    roomCell: "booked",
    dishCell: "locked",
    dishOverride: "ordered",
    room: "booked",
    dish: "ordered",
    hold: "HARD",
  },
  {
    name: "an override with an empty cell",
    roomCell: null,
    dishCell: null,
    dishOverride: "locked",
    room: "prebooked",
    dish: "locked",
    hold: "SOFT",
  },
];

type ArrangeInput = { setup: GridSetup; test: Case };

async function arrange({ setup, test }: ArrangeInput) {
  const { context, room, roomState, food } = setup;
  const ticket = await setup.newTicket();
  const roomLine = await addLine({ setup, ticketId: ticket.id, itemId: room.id });
  const dishLine = await addLine({ setup, ticketId: ticket.id, itemId: food.dish.id });
  const cells = [
    { entityTypeId: room.entityTypeId, stateId: test.roomCell && roomState[test.roomCell].id },
    { entityTypeId: food.type.id, stateId: test.dishCell && food[test.dishCell].id },
  ];
  for (const cell of cells)
    unwrap({ result: await setCell({ context, phase: "Confirmed", ...cell }) });
  if (test.dishOverride) {
    const stateId = food[test.dishOverride].id;
    unwrap({ result: await toState({ context, lineId: dishLine.id, stateId }) });
  }
  return { ticket, roomLine, dishLine };
}

describe("ticket.changePhase moves lines by the phase grid (ADR 0044)", () => {
  it.each(CASES)("$name", async (test) => {
    const setup = await gridSetup();
    const { context, roomState, food } = setup;
    const { ticket, roomLine, dishLine } = await arrange({ setup, test });
    unwrap({ result: await moveToPhase({ context, ticketId: ticket.id, name: "Confirmed" }) });
    const room = await lineNow({ context, lineId: roomLine.id });
    const dish = await lineNow({ context, lineId: dishLine.id });
    expect(room.stateId).toBe(roomState[test.room].id);
    expect(dish.stateId).toBe(food[test.dish].id);
    expect(dish.stateOverridden).toBe(test.dishOverride !== undefined);
    const holds = await activeOccupancies({ context, sourceId: roomLine.id });
    expect(holds.map((row) => row.holdKind)).toEqual([test.hold]);
  });

  it("leaves holdsUntil alone and audits each moved line", async () => {
    const setup = await gridSetup();
    const { context, room, roomState } = setup;
    const ticket = await setup.newTicket();
    const holdsUntil = new Date(Date.UTC(2026, 9, 30));
    await context.db.ticket.update({ where: { id: ticket.id }, data: { holdsUntil } });
    const line = await addLine({ setup, ticketId: ticket.id, itemId: room.id });
    const cell = { entityTypeId: room.entityTypeId, stateId: roomState.booked.id };
    unwrap({ result: await setCell({ context, phase: "Confirmed", ...cell }) });
    const moved = unwrap({
      result: await moveToPhase({ context, ticketId: ticket.id, name: "Confirmed" }),
    });
    expect(moved.holdsUntil).toEqual(holdsUntil);
    const audit = await context.db.auditLog.findFirstOrThrow({
      where: { entityId: line.id, operation: "ticket.changePhase" },
    });
    expect(audit.after).toMatchObject({ stateId: roomState.booked.id });
  });
});
