import { ticketBalance } from "../../features/payment/ticket-balance";
import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoPaymentsInput = { context: ExecuteContext; org: DemoOrg };

/** SUCCEEDED payments minus refunds per ticket, summed straight from the rows. */
async function succeededByTicket({ context }: Pick<CheckDemoPaymentsInput, "context">) {
  const rows = await context.db.payment.findMany({
    where: { status: { in: ["SUCCEEDED", "REFUNDED"] } },
    select: { ticketId: true, amountMinor: true, refundedMinor: true },
  });
  const paid = new Map<string, number>();
  for (const row of rows) {
    paid.set(row.ticketId, (paid.get(row.ticketId) ?? 0) + row.amountMinor - row.refundedMinor);
  }
  return paid;
}

/**
 * ADR 0057: every ticket with an accepted quote owes that quote's total minus its SUCCEEDED
 * payments, as derived by `payment.balance`; the demo's money (`ticket.money`) is there: one
 * SENT deposit request and one SUCCEEDED payment per spec. Returns failure messages.
 */
export async function checkDemoPayments({ context, org }: CheckDemoPaymentsInput) {
  const failures: string[] = [];
  const paid = await succeededByTicket({ context });
  const accepted = await context.db.quote.findMany({ where: { quoteStatus: "ACCEPTED" } });
  for (const quote of accepted) {
    const balance = await ticketBalance({ context, ticketId: quote.ticketId, withQuotes: true });
    const expected = quote.totalInclVatMinor - (paid.get(quote.ticketId) ?? 0);
    if (balance.billedFrom !== "QUOTE" || balance.balanceMinor !== expected) {
      failures.push(
        `${org.slug}: ticket ${quote.ticketId} balance ${balance.balanceMinor}, expected ${expected}`,
      );
    }
  }
  const money = org.tickets.flatMap((ticket) => (ticket.money ? [ticket.money] : []));
  const deposits = await context.db.deposit.count({ where: { status: "SENT" } });
  const wanted = money.filter((m) => m.deposit).length;
  if (deposits !== wanted)
    failures.push(`${org.slug}: ${deposits} sent deposits, expected ${wanted}`);
  const total = money.reduce((sum, m) => sum + (m.paidKr ?? 0) * 100, 0);
  const seen = [...paid.values()].reduce((sum, value) => sum + value, 0);
  if (seen !== total) failures.push(`${org.slug}: ${seen} paid, expected ${total}`);
  return failures;
}
