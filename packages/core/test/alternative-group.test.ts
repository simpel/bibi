import { describe, expect, it } from "vitest";
import {
  archiveAlternativeGroup,
  archiveCustomer,
  execute,
  getAlternativeGroup,
  updateAlternativeGroup,
} from "../src/index";
import { choose, groupLines, roomAlternatives } from "./alternative-group-helpers";
import { errorCode, peer, unwrap } from "./helpers";
import { toState } from "./item-state-helpers";
import { activeOccupancies } from "./line-helpers";
import { addLine, lineNow, setCell } from "./phase-grid-helpers";
import { moveToPhase } from "./ticket-helpers";

describe("alternative groups (ADR 0052)", () => {
  it("groups two soft-held lines as options and lists them", async () => {
    const { context, a, b, group } = await roomAlternatives();
    expect(group).toMatchObject({ name: "Room", chosenLineId: null });
    expect(group.optionLineIds.sort()).toEqual([a.id, b.id].sort());
    expect((await lineNow({ context, lineId: a.id })).alternativeGroupId).toBe(group.id);
    expect(await activeOccupancies({ context, lineId: b.id })).toHaveLength(1);
  });

  it("refuses a second option in a hard-hold state", async () => {
    const { context, a, b, roomState } = await roomAlternatives();
    unwrap({ result: await toState({ context, lineId: a.id, stateId: roomState.booked.id }) });
    const second = await toState({ context, lineId: b.id, stateId: roomState.booked.id });
    expect(errorCode({ result: second })).toBe("CONFLICT");
    expect((await lineNow({ context, lineId: b.id })).stateId).toBe(roomState.prebooked.id);
  });

  it("fails a phase move that would hard-hold both options, without any change", async () => {
    const { context, a, b, room, roomState, ticket } = await roomAlternatives();
    const cell = { entityTypeId: room.entityTypeId, stateId: roomState.booked.id };
    unwrap({ result: await setCell({ context, phase: "Confirmed", ...cell }) });
    const moved = await moveToPhase({ context, ticketId: ticket.id, name: "Confirmed" });
    expect(errorCode({ result: moved })).toBe("CONFLICT");
    for (const lineId of [a.id, b.id]) {
      expect((await lineNow({ context, lineId })).stateId).toBe(roomState.prebooked.id);
    }
  });

  it("refuses options that are hard-held twice, listed twice or in another group", async () => {
    const setup = await roomAlternatives();
    const { context, ticket, a, room, roomState } = setup;
    const c = await addLine({ setup, ticketId: ticket.id, itemId: room.id, from: 14 });
    const d = await addLine({ setup, ticketId: ticket.id, itemId: room.id, from: 17 });
    for (const lineId of [c.id, d.id]) {
      unwrap({ result: await toState({ context, lineId, stateId: roomState.booked.id }) });
    }
    for (const lineIds of [
      [c.id, d.id],
      [c.id, c.id],
      [a.id, c.id],
      ["missing", c.id],
    ]) {
      const result = await groupLines({ context, ticketId: ticket.id, lineIds });
      expect(errorCode({ result }), JSON.stringify(lineIds)).toBe("VALIDATION");
    }
  });

  it("choosing an option releases the others' holds in the same change", async () => {
    const { context, a, b, group, roomState } = await roomAlternatives();
    const chosen = unwrap({ result: await choose({ context, id: group.id, lineId: a.id }) });
    expect(chosen.chosenLineId).toBe(a.id);
    const other = await lineNow({ context, lineId: b.id });
    expect(other).toMatchObject({ stateId: roomState.released.id, stateOverridden: true });
    expect(await activeOccupancies({ context, lineId: b.id })).toEqual([]);
    expect(await activeOccupancies({ context, lineId: a.id })).toHaveLength(1);
    const again = await choose({ context, id: group.id, lineId: b.id });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    const relist = { id: group.id, lineIds: [a.id, b.id] };
    const update = await execute({ operation: updateAlternativeGroup, input: relist, context });
    expect(errorCode({ result: update })).toBe("CONFLICT");
    const audit = await context.db.auditLog.findMany({ where: { entityId: b.id } });
    expect(audit.length).toBeGreaterThan(0);
  });

  it("refuses a line that is not an option, and a caller without line:write", async () => {
    const setup = await roomAlternatives();
    const { context, ticket, room, group, a } = setup;
    const loose = await addLine({ setup, ticketId: ticket.id, itemId: room.id, from: 14 });
    const result = await choose({ context, id: group.id, lineId: loose.id });
    expect(errorCode({ result })).toBe("VALIDATION");
    const reader = peer({ of: context, access: "read" });
    const denied = await choose({ context: reader, id: group.id, lineId: a.id });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    const read = await execute({ operation: getAlternativeGroup, input: group, context: reader });
    expect(unwrap({ result: read }).id).toBe(group.id);
  });

  it("dissolving makes the options ordinary lines", async () => {
    const { context, a, b, group, roomState } = await roomAlternatives();
    const input = { id: group.id };
    unwrap({ result: await execute({ operation: archiveAlternativeGroup, input, context }) });
    expect((await lineNow({ context, lineId: a.id })).alternativeGroupId).toBeNull();
    // No longer options of one group: both may now hold hard.
    for (const lineId of [a.id, b.id]) {
      unwrap({ result: await toState({ context, lineId, stateId: roomState.booked.id }) });
    }
    const gone = await execute({ operation: getAlternativeGroup, input, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });

  it("archives the group with its ticket", async () => {
    const { context, ticket, group } = await roomAlternatives();
    const input = { id: ticket.customerId, archiveTickets: true };
    unwrap({ result: await execute({ operation: archiveCustomer, input, context }) });
    const row = await context.db.alternativeGroup.findFirst({
      where: { id: group.id, status: "ARCHIVED" },
    });
    expect(row?.status).toBe("ARCHIVED");
  });
});
