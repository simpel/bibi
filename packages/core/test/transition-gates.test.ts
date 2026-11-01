import { describe, expect, it } from "vitest";
import {
  archiveTicketStatus,
  execute,
  setTicketStatusGates,
  setTicketStatusTransitions,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestTicket, moveToStatus, ticketSetup } from "./ticket-helpers";
import { provisionedContext, statusByName } from "./ticket-status-helpers";

/** A ticket in Lead (the provisioned pipeline), with nobody assigned. */
async function ticketInLead() {
  const { context, type, customer } = await ticketSetup();
  const ticket = await createTestTicket({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
  });
  return { context, ticket };
}

describe("gates on moves into a status (ADR 0067 §5, 0076)", () => {
  it("replaces a status's gates by source and merges them for each move", async () => {
    const context = await provisionedContext();
    const lead = await statusByName({ context, name: "Lead" });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const gates = [
      { fromStatusId: null, gates: ["REASON" as const] },
      { fromStatusId: lead.id, gates: ["ACCEPTED_QUOTE" as const] },
    ];
    const set = unwrap({
      result: await execute({
        operation: setTicketStatusGates,
        input: { id: confirmed.id, gates },
        context,
      }),
    });
    expect(set.gatesInto).toEqual(gates);
    const fromLead = await statusByName({ context, name: "Lead" });
    expect(fromLead.transitionGates).toContainEqual({
      toStatusId: confirmed.id,
      gates: ["ACCEPTED_QUOTE", "REASON"],
    });
    const completed = await statusByName({ context, name: "Completed" });
    const fromCompleted = await statusByName({ context, name: "Lost" });
    expect(fromCompleted.transitionGates).toEqual([]);
    expect(completed.gatesInto).toEqual([{ fromStatusId: null, gates: ["ASSIGNEE"] }]);
    const cleared = unwrap({
      result: await execute({
        operation: setTicketStatusGates,
        input: { id: confirmed.id, gates: [] },
        context,
      }),
    });
    expect(cleared.gatesInto).toEqual([]);
  });

  it("refuses an unknown or own source and an unknown target", async () => {
    const context = await provisionedContext();
    const lead = await statusByName({ context, name: "Lead" });
    const foreign = await statusByName({ context: await provisionedContext(), name: "Lead" });
    const run = ({ id, from }: { id: string; from: string }) =>
      execute({
        operation: setTicketStatusGates,
        input: { id, gates: [{ fromStatusId: from, gates: ["REASON" as const] }] },
        context,
      });
    expect(errorCode({ result: await run({ id: lead.id, from: lead.id }) })).toBe("VALIDATION");
    expect(errorCode({ result: await run({ id: lead.id, from: foreign.id }) })).toBe("VALIDATION");
    expect(errorCode({ result: await run({ id: foreign.id, from: lead.id }) })).toBe("NOT_FOUND");
  });

  it("checks the gates of the move taken, from any status plus the source", async () => {
    const { context, ticket } = await ticketInLead();
    const lead = await statusByName({ context, name: "Lead" });
    const lost = await statusByName({ context, name: "Lost" });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    // Into Lost a reason is needed from any status, but not when coming from Lead.
    expect(confirmed.transitionGates).toContainEqual({ toStatusId: lost.id, gates: ["REASON"] });
    const refused = await moveToStatus({ context, ticketId: ticket.id, name: "Lost" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const gates = [{ fromStatusId: confirmed.id, gates: ["REASON" as const] }];
    const input = { id: lost.id, gates };
    unwrap({ result: await execute({ operation: setTicketStatusGates, input, context }) });
    const moved = await moveToStatus({ context, ticketId: ticket.id, name: "Lost" });
    expect(unwrap({ result: moved }).statusId).toBe(lost.id);
    expect(lead.id).not.toBe(lost.id);
  });

  it("limits a restricting status to its list and drops rules that name an archived status", async () => {
    const { context, ticket } = await ticketInLead();
    const lead = await statusByName({ context, name: "Lead" });
    const completed = await statusByName({ context, name: "Completed" });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const only = { id: lead.id, allowedNext: "ONLY_THESE" as const, toStatusIds: [completed.id] };
    unwrap({
      result: await execute({ operation: setTicketStatusTransitions, input: only, context }),
    });
    const refused = await moveToStatus({ context, ticketId: ticket.id, name: "Confirmed" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const archive = { id: completed.id, targetStatusId: confirmed.id };
    unwrap({ result: await execute({ operation: archiveTicketStatus, input: archive, context }) });
    const after = await statusByName({ context, name: "Lead" });
    expect(after).toMatchObject({ restrictsNext: true, transitionsTo: [] });
    expect(await context.db.ticketStatusGate.count({ where: { toStatusId: completed.id } })).toBe(
      0,
    );
  });
});
