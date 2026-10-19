import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  changeTicketPhase,
  createTicketPhase,
  type ExecuteContext,
  execute,
  getQuote,
  getTicket,
  grantAll,
  sendQuote,
  setTicketPhaseTransitions,
  updateTicketPhase,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestQuote, quoteSetup } from "./quote-helpers";
import { phaseByName } from "./ticket-phase-helpers";

type Ctx = { context: ExecuteContext };

/** "Quote sent" (QUOTE_SENT) after Lead, and Confirmed as the QUOTE_ACCEPTED phase. */
async function configure({ context }: Ctx) {
  const input = { name: "Quote sent", color: "#7c3aed", event: "QUOTE_SENT" as const };
  const sent = unwrap({ result: await execute({ operation: createTicketPhase, input, context }) });
  const confirmed = await phaseByName({ context, name: "Confirmed" });
  const update = { id: confirmed.id, event: "QUOTE_ACCEPTED" as const };
  unwrap({ result: await execute({ operation: updateTicketPhase, input: update, context }) });
  const lead = await phaseByName({ context, name: "Lead" });
  const moves = [
    { id: lead.id, toPhaseIds: [sent.id, confirmed.id] },
    { id: sent.id, toPhaseIds: [confirmed.id] },
  ];
  for (const move of moves) {
    const result = await execute({ operation: setTicketPhaseTransitions, input: move, context });
    unwrap({ result });
  }
  return { sent, confirmed, lead };
}

async function sendable() {
  const setup = await quoteSetup();
  const lines = [{ itemId: setup.lunch.id, quantity: 20 }];
  const quote = await createTestQuote({ context: setup.context, ticketId: setup.ticket.id, lines });
  return { ...setup, quote };
}

const phaseOf = async ({ context, id }: Ctx & { id: string }) =>
  unwrap({ result: await execute({ operation: getTicket, input: { id }, context }) }).phaseId;

describe("quote events move the ticket (ADR 0043)", () => {
  it("moves the ticket on send and on accept, and stores who accepted", async () => {
    const { context, ticket, quote } = await sendable();
    const { sent, confirmed } = await configure({ context });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    expect(await phaseOf({ context, id: ticket.id })).toBe(sent.id);
    const accepted = unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
    expect(await phaseOf({ context, id: ticket.id })).toBe(confirmed.id);
    expect(accepted).toMatchObject({ quoteStatus: "ACCEPTED", acceptanceMethod: "MANUAL" });
    expect(accepted.acceptedBy).toBe(context.actor.userId);
    expect(accepted.acceptedAt).toBeInstanceOf(Date);
  });

  it("leaves the phase when the organization has no phase for the event", async () => {
    const { context, ticket, quote } = await sendable();
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    const accepted = unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
    expect(await phaseOf({ context, id: ticket.id })).toBe(ticket.phaseId);
    expect(accepted.quoteStatus).toBe("ACCEPTED");
    const again = await execute({ operation: acceptQuote, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
  });

  it("leaves the phase when the organization does not allow the move", async () => {
    const { context, ticket, quote } = await sendable();
    const { sent, lead } = await configure({ context });
    const none = { id: lead.id, toPhaseIds: [] };
    unwrap({
      result: await execute({ operation: setTicketPhaseTransitions, input: none, context }),
    });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    expect(await phaseOf({ context, id: ticket.id })).toBe(lead.id);
    expect(sent.id).not.toBe(lead.id);
  });

  it("fails the accept without any change when the move is blocked", async () => {
    const { context, ticket, quote } = await sendable();
    await configure({ context });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    const nobody = await context.db.assignment.deleteMany({ where: { subjectId: ticket.id } });
    expect(nobody.count).toBeGreaterThan(0);
    const result = await execute({ operation: acceptQuote, input, context });
    expect(errorCode({ result })).toBe("CONFLICT");
    const kept = unwrap({ result: await execute({ operation: getQuote, input, context }) });
    expect(kept).toMatchObject({ quoteStatus: "SENT", acceptedAt: null, acceptanceMethod: null });
  });

  it("needs ticket:write when a phase would move", async () => {
    const { context, quote, ticket } = await sendable();
    const { sent } = await configure({ context });
    const limited = { ...grantAll({}), ticket: ["view" as const] };
    const caller = { ...context, permissions: limited };
    const input = { id: quote.id };
    const result = await execute({ operation: sendQuote, input, context: caller });
    expect(errorCode({ result })).toBe("FORBIDDEN");
    expect(await phaseOf({ context, id: ticket.id })).not.toBe(sent.id);
  });

  it("does not let a phase with an event be entered by hand", async () => {
    const { context, ticket } = await sendable();
    const { sent } = await configure({ context });
    const input = { ticketId: ticket.id, phaseId: sent.id };
    const result = await execute({ operation: changeTicketPhase, input, context });
    expect(errorCode({ result })).toBe("CONFLICT");
  });

  it("gives an event to one phase only", async () => {
    const { context } = await sendable();
    const { sent, confirmed } = await configure({ context });
    const input = { id: confirmed.id, event: "QUOTE_SENT" as const };
    const moved = unwrap({
      result: await execute({ operation: updateTicketPhase, input, context }),
    });
    expect(moved.event).toBe("QUOTE_SENT");
    expect((await phaseByName({ context, name: sent.name })).event).toBeNull();
  });
});
