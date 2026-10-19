import type { OperationContext } from "../../operations/types";
import type { ReceivableKind, ReceivableSettlement, TicketBalanceDto } from "./balance-schema";
import { paidByReceivable, settlementOf } from "./settlement";

type Db = { context: Pick<OperationContext, "db"> };

type Due = { kind: ReceivableKind; id: string; amountMinor: number };

export type TicketBalanceInput = Db & {
  ticketId: string;
  /** False when the caller may not read quotes: they are then neither listed nor billed. */
  withQuotes: boolean;
};

/** The ticket's receivables: quotes that were sent or are paid against, deposits and invoices. */
async function receivablesOf({ context, ticketId, withQuotes }: TicketBalanceInput) {
  const [quotes, deposits, invoices] = await Promise.all([
    withQuotes
      ? context.db.quote.findMany({
          where: {
            ticketId,
            OR: [{ quoteStatus: { in: ["SENT", "ACCEPTED"] } }, { payments: { some: {} } }],
          },
          orderBy: { version: "asc" },
        })
      : [],
    context.db.deposit.findMany({ where: { ticketId }, orderBy: { createdAt: "asc" } }),
    context.db.invoice.findMany({ where: { ticketId }, orderBy: { number: "asc" } }),
  ]);
  return { quotes, deposits, invoices };
}

type Receivables = Awaited<ReturnType<typeof receivablesOf>>;

/** Every receivable with its fixed amount; VOID deposits and invoices are no longer owed. */
function dueOf({ quotes, deposits, invoices }: Receivables): Due[] {
  return [
    ...quotes.map((q) => ({ kind: "QUOTE" as const, id: q.id, amountMinor: q.totalInclVatMinor })),
    ...deposits.flatMap((d) =>
      d.status === "VOID"
        ? []
        : [{ kind: "DEPOSIT" as const, id: d.id, amountMinor: d.amountMinor }],
    ),
    ...invoices.flatMap((i) =>
      i.status === "VOID"
        ? []
        : [{ kind: "INVOICE" as const, id: i.id, amountMinor: i.totalInclVatMinor }],
    ),
  ];
}

/** SENT invoices once the ticket is invoiced, else the ACCEPTED quote, else nothing. */
function billOf({ quotes, invoices }: Receivables) {
  const sent = invoices.filter((i) => i.status === "SENT");
  if (sent.length > 0) {
    const billedMinor = sent.reduce((sum, i) => sum + i.totalInclVatMinor, 0);
    return { billedFrom: "INVOICE" as const, billedMinor };
  }
  const accepted = quotes.findLast((q) => q.quoteStatus === "ACCEPTED");
  if (accepted) return { billedFrom: "QUOTE" as const, billedMinor: accepted.totalInclVatMinor };
  return { billedFrom: "NONE" as const, billedMinor: 0 };
}

/**
 * What the ticket owes (ADR 0057): what is billed minus every SUCCEEDED payment (less refunds)
 * on it, and each receivable with what is paid against it.
 */
export async function ticketBalance({
  context,
  ticketId,
  withQuotes,
}: TicketBalanceInput): Promise<TicketBalanceDto> {
  const found = await receivablesOf({ context, ticketId, withQuotes });
  const paid = await paidByReceivable({ context, ticketIds: [ticketId] });
  const receivables: ReceivableSettlement[] = dueOf(found).map(({ kind, id, amountMinor }) => ({
    ...{ kind, id, amountMinor },
    ...settlementOf({ paid, id, amountMinor }),
  }));
  const { billedFrom, billedMinor } = billOf(found);
  const paidMinor = [...paid.values()].reduce((sum, value) => sum + value, 0);
  const balanceMinor = billedMinor - paidMinor;
  return {
    ticketId,
    currency: "SEK",
    billedFrom,
    billedMinor,
    paidMinor,
    balanceMinor,
    receivables,
  };
}
