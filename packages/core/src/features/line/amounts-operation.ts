import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { deriveTicketLines } from "../quote/derive-lines";
import { quoteTotals, totalIsFrom } from "../quote/line-totals";
import { LineAmountsInputSchema, LineAmountsOutputSchema } from "./amounts-schema";

export const lineAmounts = defineOperation({
  name: "line.amounts",
  kind: "query",
  description:
    "What a ticket's lines cost now and the ticket's total, by the same rules as a draft quote " +
    "(ADR 0052): each priced line's amount excl. VAT and its VAT, and whether it counts in the " +
    "total (a bundle's parts, INCLUDED options, covered parents and unchosen alternatives do " +
    "not; ADR 0059, 0082, 0088). The totals are a 'from' price while an alternative group is " +
    "not chosen. Writes nothing.",
  input: LineAmountsInputSchema,
  output: LineAmountsOutputSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const ticket = await context.db.ticket.findFirst({
      where: { id: input.ticketId },
      select: { id: true },
    });
    if (!ticket) return notFound({ entity: "Ticket" });
    const derived = (await deriveTicketLines({ context, ticketIds: [ticket.id] })).get(ticket.id);
    const own = (derived ?? []).map(({ line }) => line);
    const lines = own.map(({ lineId, totalExclVatMinor, vatMinor, inTotal }) => ({
      ...{ lineId, totalExclVatMinor, vatMinor, inTotal },
    }));
    const totals = quoteTotals({ lines: own });
    return ok({ value: { lines, ...totals, totalIsFrom: totalIsFrom({ lines: own }) } });
  },
});
