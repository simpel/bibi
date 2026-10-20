import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  execute,
  sendQuote,
  ticketPhaseHistory,
  updateTicketPhase,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { draftQuote } from "./quote-helpers";
import { moveToPhase } from "./ticket-helpers";
import { phaseByName } from "./ticket-phase-helpers";

type Ctx = Awaited<ReturnType<typeof draftQuote>>["context"];

const historyOf = async ({ context, ticketId }: { context: Ctx; ticketId: string }) =>
  unwrap({
    result: await execute({ operation: ticketPhaseHistory, input: { ticketId }, context }),
  });

/** A ticket in Lead with a draft quote, and Confirmed requiring an accepted quote. */
async function guarded() {
  const setup = await draftQuote();
  const { context } = setup;
  const confirmed = await phaseByName({ context, name: "Confirmed" });
  const input = { id: confirmed.id, requiresAcceptedQuote: true };
  unwrap({ result: await execute({ operation: updateTicketPhase, input, context }) });
  return { ...setup, confirmed };
}

const accept = async ({ context, id }: { context: Ctx; id: string }) => {
  unwrap({ result: await execute({ operation: sendQuote, input: { id }, context }) });
  unwrap({ result: await execute({ operation: acceptQuote, input: { id }, context }) });
};

describe("ticket phase history (ADR 0054)", () => {
  it("starts with the create, appends each move and is the ticket's phase", async () => {
    const { context, ticket } = await draftQuote();
    const lost = unwrap({
      result: await moveToPhase({ context, ticketId: ticket.id, name: "Lost", reason: "Price" }),
    });
    const { items, warnings } = await historyOf({ context, ticketId: ticket.id });
    expect(items.map((row) => [row.fromPhaseId, row.toPhaseId, row.trigger, row.reason])).toEqual([
      [null, ticket.phaseId, "MANUAL", null],
      [ticket.phaseId, lost.phaseId, "MANUAL", "Price"],
    ]);
    expect(items[1]?.changedBy).toBe(context.actor.userId);
    expect(lost).toMatchObject({ phaseReason: "Price", phaseChangedAt: items[1]?.changedAt });
    expect(warnings).toEqual([]);
  });

  it("refuses a direct write of the phase", async () => {
    const { context, ticket } = await draftQuote();
    const lost = await phaseByName({ context, name: "Lost" });
    const direct = getDb().ticket.update({ where: { id: ticket.id }, data: { phaseId: lost.id } });
    await expect(direct).rejects.toThrow(/history_projection_only/);
  });

  it("guards the accepted-quote fact on entry", async () => {
    const { context, ticket, quote, confirmed } = await guarded();
    const refused = await moveToPhase({ context, ticketId: ticket.id, name: "Confirmed" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(refused.ok ? [] : refused.error.issues.map((issue) => issue.path)).toEqual(["quote"]);
    await accept({ context, id: quote.id });
    const moved = unwrap({
      result: await moveToPhase({ context, ticketId: ticket.id, name: "Confirmed" }),
    });
    expect(moved.phaseId).toBe(confirmed.id);
  });

  it("warns when an accepted quote meets an earlier phase, only to quote readers", async () => {
    const { context, ticket, quote } = await guarded();
    await accept({ context, id: quote.id });
    const { warnings } = await historyOf({ context, ticketId: ticket.id });
    expect(warnings).toEqual(["QUOTE_ACCEPTED_IN_EARLIER_PHASE"]);
    const ticketsOnly = testContext({
      organizationId: context.organizationId,
      permissions: { ticket: ["read"] },
    });
    const hidden = await historyOf({ context: ticketsOnly, ticketId: ticket.id });
    expect(hidden.warnings).toEqual([]);
    expect(hidden.items).toHaveLength(1);
    unwrap({ result: await moveToPhase({ context, ticketId: ticket.id, name: "Confirmed" }) });
    expect((await historyOf({ context, ticketId: ticket.id })).warnings).toEqual([]);
  });
});
