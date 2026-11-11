import { DEFAULT_CURRENCY } from "../../number/number-formats";
import type { OperationContext } from "../../operations/types";
import { DUE_INCLUDE, invoiceDueMinor } from "../invoice/to-invoice-dto";
import type { OrderBalanceDto, ReceivableKind, ReceivableSettlement } from "./balance-schema";
import { billOf } from "./billed";
import { paidByReceivable, settlementOf } from "./settlement";

type Db = { context: Pick<OperationContext, "db"> };

type Due = { kind: ReceivableKind; id: string; amountMinor: number };

export type OrderBalanceInput = Db & {
  orderId: string;
  /** False when the caller may not read quotes: they are then neither listed nor billed. */
  withQuotes: boolean;
};

/** The order's receivables: quotes that were sent or are paid against, deposits and invoices. */
async function receivablesOf({ context, orderId, withQuotes }: OrderBalanceInput) {
  const [quotes, deposits, invoices] = await Promise.all([
    withQuotes
      ? context.db.quote.findMany({
          where: {
            orderId,
            OR: [{ quoteStatus: { in: ["SENT", "ACCEPTED"] } }, { payments: { some: {} } }],
          },
          orderBy: { version: "asc" },
        })
      : [],
    context.db.deposit.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } }),
    context.db.invoice.findMany({
      where: { orderId },
      orderBy: { number: "asc" },
      include: DUE_INCLUDE,
    }),
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
        : [
            {
              kind: "INVOICE" as const,
              id: i.id,
              // What the invoice asks for; the deducted deposits are paid on themselves (ADR 0090).
              amountMinor: invoiceDueMinor({ invoice: i, ...i }),
            },
          ],
    ),
  ];
}

/**
 * What the order owes (ADR 0057): what is billed minus every SUCCEEDED payment (less refunds)
 * on it, and each receivable with what is paid against it.
 */
export async function orderBalance({
  context,
  orderId,
  withQuotes,
}: OrderBalanceInput): Promise<OrderBalanceDto> {
  const found = await receivablesOf({ context, orderId, withQuotes });
  const paid = await paidByReceivable({ context, orderIds: [orderId] });
  const receivables: ReceivableSettlement[] = dueOf(found).map(({ kind, id, amountMinor }) => ({
    ...{ kind, id, amountMinor },
    ...settlementOf({ paid, id, amountMinor }),
  }));
  const { billedFrom, billedMinor } = billOf(found);
  const paidMinor = [...paid.values()].reduce((sum, value) => sum + value, 0);
  const balanceMinor = billedMinor - paidMinor;
  return {
    orderId,
    currency: DEFAULT_CURRENCY,
    billedFrom,
    billedMinor,
    paidMinor,
    balanceMinor,
    receivables,
  };
}
