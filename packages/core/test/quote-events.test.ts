import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  changeTicketStatus,
  createTicketStatus,
  type ExecuteContext,
  execute,
  getQuote,
  getTicket,
  grantAll,
  sendQuote,
  setTicketStatusTransitions,
  updateTicketStatus,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";
import { statusByName } from "./ticket-status-helpers";

type Ctx = { context: ExecuteContext };

/** "Quote sent" (QUOTE_SENT) after Lead, and Confirmed as the QUOTE_ACCEPTED status. */
async function configure({ context }: Ctx) {
  const input = { name: "Quote sent", color: "#7c3aed", event: "QUOTE_SENT" as const };
  const sent = unwrap({ result: await execute({ operation: createTicketStatus, input, context }) });
  const confirmed = await statusByName({ context, name: "Confirmed" });
  const update = { id: confirmed.id, event: "QUOTE_ACCEPTED" as const };
  unwrap({ result: await execute({ operation: updateTicketStatus, input: update, context }) });
  const lead = await statusByName({ context, name: "Lead" });
  const moves = [
    { id: lead.id, toStatusIds: [sent.id, confirmed.id] },
    { id: sent.id, toStatusIds: [confirmed.id] },
  ];
  for (const move of moves) {
    const result = await execute({ operation: setTicketStatusTransitions, input: move, context });
    unwrap({ result });
  }
  return { sent, confirmed, lead };
}

async function sendable() {
  const setup = await quoteSetup();
  const { context, ticket, lineType } = setup;
  const lines = [{ itemId: setup.lunch.id }];
  await addTestLines({ context, ticketId: ticket.id, lineTypeId: lineType.id, lines });
  const quote = await createTestQuote({ context, ticketId: ticket.id });
  return { ...setup, quote };
}

const statusOf = async ({ context, id }: Ctx & { id: string }) =>
  unwrap({ result: await execute({ operation: getTicket, input: { id }, context }) }).statusId;

describe("quote events move the ticket (ADR 0043)", () => {
  it("moves the ticket on send and on accept, and stores who accepted", async () => {
    const { context, ticket, quote } = await sendable();
    const { sent, confirmed } = await configure({ context });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    expect(await statusOf({ context, id: ticket.id })).toBe(sent.id);
    const accepted = unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
    expect(await statusOf({ context, id: ticket.id })).toBe(confirmed.id);
    expect(accepted).toMatchObject({ quoteStatus: "ACCEPTED", acceptanceMethod: "MANUAL" });
    expect(accepted.acceptedBy).toBe(context.actor.userId);
    expect(accepted.acceptedAt).toBeInstanceOf(Date);
  });

  it("leaves the status when the organization has no status for the event", async () => {
    const { context, ticket, quote } = await sendable();
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    const accepted = unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
    expect(await statusOf({ context, id: ticket.id })).toBe(ticket.statusId);
    expect(accepted.quoteStatus).toBe("ACCEPTED");
    const again = await execute({ operation: acceptQuote, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
  });

  it("leaves the status when the organization does not allow the move", async () => {
    const { context, ticket, quote } = await sendable();
    const { sent, lead } = await configure({ context });
    const none = { id: lead.id, toStatusIds: [] };
    unwrap({
      result: await execute({ operation: setTicketStatusTransitions, input: none, context }),
    });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    expect(await statusOf({ context, id: ticket.id })).toBe(lead.id);
    expect(sent.id).not.toBe(lead.id);
  });

  it("fails the accept without any change when the move is blocked", async () => {
    const { context, ticket, quote } = await sendable();
    await configure({ context });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    const nobody = await context.db.assignment.deleteMany({ where: { recordId: ticket.id } });
    expect(nobody.count).toBeGreaterThan(0);
    const result = await execute({ operation: acceptQuote, input, context });
    expect(errorCode({ result })).toBe("CONFLICT");
    const kept = unwrap({ result: await execute({ operation: getQuote, input, context }) });
    expect(kept).toMatchObject({ quoteStatus: "SENT", acceptedAt: null, acceptanceMethod: null });
  });

  it("needs ticket:write when a status would move", async () => {
    const { context, quote, ticket } = await sendable();
    const { sent } = await configure({ context });
    const limited = { ...grantAll({}), ticket: ["read" as const] };
    const caller = { ...context, permissions: limited };
    const input = { id: quote.id };
    const result = await execute({ operation: sendQuote, input, context: caller });
    expect(errorCode({ result })).toBe("FORBIDDEN");
    expect(await statusOf({ context, id: ticket.id })).not.toBe(sent.id);
  });

  it("does not let a status with an event be entered by hand", async () => {
    const { context, ticket } = await sendable();
    const { sent } = await configure({ context });
    const input = { ticketId: ticket.id, statusId: sent.id };
    const result = await execute({ operation: changeTicketStatus, input, context });
    expect(errorCode({ result })).toBe("CONFLICT");
  });

  it("gives an event to one status only", async () => {
    const { context } = await sendable();
    const { sent, confirmed } = await configure({ context });
    const input = { id: confirmed.id, event: "QUOTE_SENT" as const };
    const moved = unwrap({
      result: await execute({ operation: updateTicketStatus, input, context }),
    });
    expect(moved.event).toBe("QUOTE_SENT");
    expect((await statusByName({ context, name: sent.name })).event).toBeNull();
  });
});
