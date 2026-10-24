import { describe, expect, it } from "vitest";
import { execute, setItemStateTransitions } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { toState } from "./item-state-helpers";
import { activeOccupancies } from "./line-helpers";
import { addLine, type GridSetup, gridSetup, lineNow, setCell } from "./status-grid-helpers";
import { moveToStatus } from "./ticket-helpers";

type Blocker = "collision" | "transition" | "assignee";

type ArrangeInput = { setup: GridSetup; blockers: readonly Blocker[] };

/**
 * A ticket in Lead with a room line and a dish line; Confirmed moves the room to Booked and the
 * dish to Locked. Each blocker is then arranged: another ticket books the room at the same time,
 * Estimated may only move to Ordered, or the ticket has no assignee.
 */
async function arrange({ setup, blockers }: ArrangeInput) {
  const { context, room, roomState, food } = setup;
  const ticket = await setup.newTicket({ assigned: !blockers.includes("assignee") });
  const roomLine = await addLine({ setup, ticketId: ticket.id, itemId: room.id });
  const dishLine = await addLine({ setup, ticketId: ticket.id, itemId: food.dish.id });
  for (const cell of [
    { entityTypeId: room.entityTypeId, stateId: roomState.booked.id },
    { entityTypeId: food.type.id, stateId: food.locked.id },
  ]) {
    unwrap({ result: await setCell({ context, ticketStatus: "Confirmed", ...cell }) });
  }
  if (blockers.includes("collision")) {
    const other = await setup.newTicket();
    const holder = await addLine({ setup, ticketId: other.id, itemId: room.id, from: 10 });
    unwrap({ result: await toState({ context, lineId: holder.id, stateId: roomState.booked.id }) });
  }
  if (blockers.includes("transition")) {
    const input = { id: food.estimated.id, toStateIds: [food.ordered.id] };
    unwrap({ result: await execute({ operation: setItemStateTransitions, input, context }) });
  }
  return { ticket, roomLine, dishLine };
}

type Case = { name: string; blockers: Blocker[]; paths: (lines: Lines) => string[] };
type Lines = { roomLine: string; dishLine: string };

const CASES: Case[] = [
  {
    name: "a hard hold collision",
    blockers: ["collision"],
    paths: ({ roomLine }) => [`lines.${roomLine}`],
  },
  {
    name: "a disallowed state transition",
    blockers: ["transition"],
    paths: ({ dishLine }) => [`lines.${dishLine}`],
  },
  { name: "a missing assignee", blockers: ["assignee"], paths: () => ["assigneeId"] },
  {
    name: "every blocker at once",
    blockers: ["collision", "transition", "assignee"],
    paths: ({ roomLine, dishLine }) => ["assigneeId", `lines.${roomLine}`, `lines.${dishLine}`],
  },
];

describe("a blocked status move changes nothing (ADR 0044)", () => {
  it.each(CASES)("refuses $name and lists it", async ({ blockers, paths }) => {
    const setup = await gridSetup();
    const { context, roomState, food } = setup;
    const { ticket, roomLine, dishLine } = await arrange({ setup, blockers });
    const refused = await moveToStatus({ context, ticketId: ticket.id, name: "Confirmed" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const issues = refused.ok ? [] : refused.error.issues;
    const lines = { roomLine: roomLine.id, dishLine: dishLine.id };
    // Status blockers first; the lines in time order (both start at 9, so any order among them).
    const sorted = ({ list }: { list: string[] }) => [...list].sort();
    expect(sorted({ list: issues.map((issue) => issue.path) })).toEqual(
      sorted({ list: paths(lines) }),
    );
    expect(issues[0]?.path).toBe(paths(lines)[0]);
    if (blockers.includes("collision")) {
      const [collision] = issues.filter((issue) => issue.path === `lines.${roomLine.id}`);
      expect(collision?.message).toMatch(/booked by ticket #\d+ on 2026-11-01/);
    }
    const after = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    expect(after.statusId).toBe(ticket.statusId);
    expect((await lineNow({ context, lineId: roomLine.id })).stateId).toBe(roomState.prebooked.id);
    expect((await lineNow({ context, lineId: dishLine.id })).stateId).toBe(food.estimated.id);
    const holds = await activeOccupancies({ context, lineId: roomLine.id });
    expect(holds.map((row) => row.holdKind)).toEqual(["SOFT"]);
  });
});
