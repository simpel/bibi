import { describe, expect, it } from "vitest";
import { execute, expireTicketHolds, getLine, getTicket, updateTicket } from "../src/index";
import { unwrap } from "./helpers";
import { roomStates, toState } from "./item-state-helpers";
import { activeOccupancies, createTestLine, programSetup } from "./line-helpers";
import { createTestTicket } from "./ticket-helpers";

const PAST = new Date(Date.now() - 60_000);

describe("ticket.expireHolds (ADR 0044)", () => {
  it("drops the expiring lines of tickets whose holdsUntil has passed, and nothing else", async () => {
    const { context, ticket, type, room } = await programSetup();
    const states = await roomStates({ context, entityTypeId: room.entityTypeId });
    const base = { context, entityTypeId: type.id, itemId: room.id };
    const soft = unwrap({
      result: await createTestLine({ ...base, ticketId: ticket.id, from: 9, to: 10 }),
    });
    const hard = unwrap({
      result: await createTestLine({ ...base, ticketId: ticket.id, from: 11, to: 12 }),
    });
    unwrap({ result: await toState({ context, lineId: hard.id, stateId: states.booked.id }) });
    const open = await createTestTicket({
      context,
      entityTypeId: ticket.entityTypeId,
      customerId: ticket.customerId,
    });
    const waiting = unwrap({
      result: await createTestLine({ ...base, ticketId: open.id, from: 9, to: 10 }),
    });
    const update = { id: ticket.id, holdsUntil: PAST };
    unwrap({ result: await execute({ operation: updateTicket, input: update, context }) });

    const result = unwrap({
      result: await execute({ operation: expireTicketHolds, input: {}, context }),
    });
    expect(result.items.map((line) => line.id)).toEqual([soft.id]);
    const stateOf = async ({ id }: { id: string }) =>
      unwrap({ result: await execute({ operation: getLine, input: { id }, context }) }).stateId;
    expect(await stateOf(soft)).toBe(states.released.id);
    expect(await stateOf(hard)).toBe(states.booked.id);
    expect(await stateOf(waiting)).toBe(states.prebooked.id);
    expect(await activeOccupancies({ context, sourceId: soft.id })).toEqual([]);
    const after = unwrap({
      result: await execute({ operation: getTicket, input: { id: ticket.id }, context }),
    });
    expect(after.phaseId).toBe(ticket.phaseId);
    const again = unwrap({
      result: await execute({ operation: expireTicketHolds, input: {}, context }),
    });
    expect(again.items).toEqual([]);
  });
});
