import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  execute,
  sendQuote,
  ticketStatusHistory,
  updateTicketStatus,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { draftQuote } from "./quote-helpers";
import { moveToStatus } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

type Ctx = Awaited<ReturnType<typeof draftQuote>>["context"];

const historyOf = async ({ context, ticketId }: { context: Ctx; ticketId: string }) =>
  unwrap({
    result: await execute({ operation: ticketStatusHistory, input: { ticketId }, context }),
  });

/** A ticket in Lead with a draft quote, and Confirmed requiring an accepted quote. */
async function guarded() {
  const setup = await draftQuote();
  const { context } = setup;
  const confirmed = await statusByName({ context, name: "Confirmed" });
  const input = { id: confirmed.id, requiresAcceptedQuote: true };
  unwrap({ result: await execute({ operation: updateTicketStatus, input, context }) });
  return { ...setup, confirmed };
}

const accept = async ({ context, id }: { context: Ctx; id: string }) => {
  unwrap({ result: await execute({ operation: sendQuote, input: { id }, context }) });
  unwrap({ result: await execute({ operation: acceptQuote, input: { id }, context }) });
};

describe("ticket status history (ADR 0054)", () => {
  it("starts with the create, appends each move and is the ticket's status", async () => {
    const { context, ticket } = await draftQuote();
    const lost = unwrap({
      result: await moveToStatus({ context, ticketId: ticket.id, name: "Lost", reason: "Price" }),
    });
    const { items, warnings } = await historyOf({ context, ticketId: ticket.id });
    expect(items.map((row) => [row.fromStatusId, row.toStatusId, row.trigger, row.reason])).toEqual(
      [
        [null, ticket.statusId, "MANUAL", null],
        [ticket.statusId, lost.statusId, "MANUAL", "Price"],
      ],
    );
    expect(items[1]?.changedBy).toBe(context.actor.userId);
    expect(lost).toMatchObject({ statusReason: "Price", statusChangedAt: items[1]?.changedAt });
    expect(warnings).toEqual([]);
  });

  it("refuses a direct write of the status", async () => {
    const { context, ticket } = await draftQuote();
    const lost = await statusByName({ context, name: "Lost" });
    const direct = getDb().ticket.update({ where: { id: ticket.id }, data: { statusId: lost.id } });
    await expect(direct).rejects.toThrow(/history_projection_only/);
  });

  it("guards the accepted-quote fact on entry", async () => {
    const { context, ticket, quote, confirmed } = await guarded();
    const refused = await moveToStatus({ context, ticketId: ticket.id, name: "Confirmed" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(refused.ok ? [] : refused.error.issues.map((issue) => issue.path)).toEqual(["quote"]);
    await accept({ context, id: quote.id });
    const moved = unwrap({
      result: await moveToStatus({ context, ticketId: ticket.id, name: "Confirmed" }),
    });
    expect(moved.statusId).toBe(confirmed.id);
  });

  it("warns when an accepted quote meets an earlier status, only to quote readers", async () => {
    const { context, ticket, quote } = await guarded();
    await accept({ context, id: quote.id });
    const { warnings } = await historyOf({ context, ticketId: ticket.id });
    expect(warnings).toEqual(["QUOTE_ACCEPTED_IN_EARLIER_STATUS"]);
    const ticketsOnly = testContext({
      organizationId: context.organizationId,
      permissions: { ticket: ["read"] },
    });
    const hidden = await historyOf({ context: ticketsOnly, ticketId: ticket.id });
    expect(hidden.warnings).toEqual([]);
    expect(hidden.items).toHaveLength(1);
    unwrap({ result: await moveToStatus({ context, ticketId: ticket.id, name: "Confirmed" }) });
    expect((await historyOf({ context, ticketId: ticket.id })).warnings).toEqual([]);
  });
});
