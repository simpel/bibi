import { describe, expect, it } from "vitest";
import { execute, setTicketStatusTransitions } from "../src/index";
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

describe("gates on transitions (ADR 0067 §5)", () => {
  it("replaces a status's gates, keeps them when omitted and drops them with the transition", async () => {
    const context = await provisionedContext();
    const lead = await statusByName({ context, name: "Lead" });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const lost = await statusByName({ context, name: "Lost" });
    type Input = Parameters<typeof setTicketStatusTransitions.handler>[0]["input"];
    const set = async ({ input }: { input: Input }) =>
      unwrap({ result: await execute({ operation: setTicketStatusTransitions, input, context }) });
    const gates = [{ toStatusId: confirmed.id, gates: ["ACCEPTED_QUOTE" as const] }];
    const replaced = await set({ input: { id: lead.id, toStatusIds: lead.transitionsTo, gates } });
    expect(replaced.transitionGates).toEqual(gates);
    const kept = await set({ input: { id: lead.id, toStatusIds: [confirmed.id, lost.id] } });
    expect(kept.transitionGates).toEqual(gates);
    const dropped = await set({ input: { id: lead.id, toStatusIds: [lost.id] } });
    expect(dropped.transitionGates).toEqual([]);
  });

  it("refuses gates on a target that is not in the set", async () => {
    const context = await provisionedContext();
    const lead = await statusByName({ context, name: "Lead" });
    const lost = await statusByName({ context, name: "Lost" });
    const input = {
      id: lead.id,
      toStatusIds: [],
      gates: [{ toStatusId: lost.id, gates: ["REASON" as const] }],
    };
    const refused = await execute({ operation: setTicketStatusTransitions, input, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("checks the gates of the transition taken, not of the target status", async () => {
    const { context, ticket } = await ticketInLead();
    const lead = await statusByName({ context, name: "Lead" });
    const lost = await statusByName({ context, name: "Lost" });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    // Confirmed → Lost keeps its REASON gate; Lead → Lost loses it.
    const gates = lead.transitionGates.filter((g) => g.toStatusId !== lost.id);
    const input = { id: lead.id, toStatusIds: lead.transitionsTo, gates };
    unwrap({ result: await execute({ operation: setTicketStatusTransitions, input, context }) });
    expect(confirmed.transitionGates).toContainEqual({ toStatusId: lost.id, gates: ["REASON"] });
    const moved = await moveToStatus({ context, ticketId: ticket.id, name: "Lost" });
    expect(unwrap({ result: moved }).statusId).toBe(lost.id);
  });
});
