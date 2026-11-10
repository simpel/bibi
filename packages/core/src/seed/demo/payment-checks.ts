import { orderBalance } from "../../features/payment/order-balance";
import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoPaymentsInput = { context: ExecuteContext; org: DemoOrg };

/** SUCCEEDED payments against quotes minus refunds per order, summed straight from the rows. */
async function succeededByOrder({ context }: Pick<CheckDemoPaymentsInput, "context">) {
  const rows = await context.db.payment.findMany({
    where: { status: { in: ["SUCCEEDED", "REFUNDED"] }, quoteId: { not: null } },
    select: {
      orderId: true,
      amountMinor: true,
      refunds: { where: { status: "SUCCEEDED" }, select: { amountMinor: true } },
    },
  });
  const paid = new Map<string, number>();
  for (const row of rows) {
    const refunded = row.refunds.reduce((sum, refund) => sum + refund.amountMinor, 0);
    paid.set(row.orderId, (paid.get(row.orderId) ?? 0) + row.amountMinor - refunded);
  }
  return paid;
}

/**
 * ADR 0057: every order with an accepted quote owes that quote's total minus its SUCCEEDED
 * payments, as derived by `payment.balance`; the demo's money (`order.money`) is there: one
 * SENT deposit request and a card, Swish and manual payment per spec, less the refund the retry
 * job settled. Returns failure messages.
 */
export async function checkDemoPayments({ context, org }: CheckDemoPaymentsInput) {
  const failures: string[] = [];
  const paid = await succeededByOrder({ context });
  // An order invoiced (ADR 0077) is billed from its invoices instead (`checkDemoFinance`).
  const accepted = await context.db.quote.findMany({
    where: { quoteStatus: "ACCEPTED", order: { invoices: { none: { status: "SENT" } } } },
  });
  for (const quote of accepted) {
    const balance = await orderBalance({ context, orderId: quote.orderId, withQuotes: true });
    const expected = quote.totalInclVatMinor - (paid.get(quote.orderId) ?? 0);
    if (balance.billedFrom !== "QUOTE" || balance.balanceMinor !== expected) {
      failures.push(
        `${org.slug}: order ${quote.orderId} balance ${balance.balanceMinor}, expected ${expected}`,
      );
    }
  }
  const money = org.orders.flatMap((order) => (order.money ? [order.money] : []));
  const deposits = await context.db.deposit.count({ where: { status: "SENT" } });
  const wanted = money.filter((m) => m.deposit).length;
  if (deposits !== wanted)
    failures.push(`${org.slug}: ${deposits} sent deposits, expected ${wanted}`);
  const total = money.reduce(
    (sum, m) =>
      sum +
      ((m.paidKr ?? 0) - (m.lostRefundKr ?? 0) + (m.swishKr ?? 0) + (m.manual?.kr ?? 0)) * 100,
    0,
  );
  const seen = [...paid.values()].reduce((sum, value) => sum + value, 0);
  if (seen !== total) failures.push(`${org.slug}: ${seen} paid, expected ${total}`);
  return failures;
}
