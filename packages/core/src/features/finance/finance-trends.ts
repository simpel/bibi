import type { OperationContext } from "../../operations/types";
import { bucketsOf, previousRange, type Range } from "../../trend/buckets";
import { type Fact, snapshotTrend, sumTrend } from "../../trend/series";
import { loadBalanceHistory, openAt } from "./balance-history";
import {
  type CashInPeriod,
  type InvoicedInPeriod,
  loadCashInPeriod,
  loadInvoicedInPeriod,
} from "./load-facts";
import { periodOf } from "./period";
import type { FinanceTrends } from "./schema";

type Context = Pick<OperationContext, "db">;

const invoicedFacts = ({ invoiced }: { invoiced: InvoicedInPeriod }): Fact[] =>
  invoiced.flatMap((row) =>
    row.sentAt ? [{ at: row.sentAt, amount: row.totalExclVatMinor }] : [],
  );

const cashFacts = ({ cash }: { cash: CashInPeriod }): Fact[] => [
  ...cash.payments.flatMap((row) =>
    row.paidAt ? [{ at: row.paidAt, amount: row.amountMinor }] : [],
  ),
  ...cash.refunds.map((row) => ({ at: row.refundedAt, amount: -row.amountMinor })),
];

export type FinanceTrendsInput = {
  context: Context;
  range: Range;
  timeZone: string;
  now: Date;
  customerId?: string | undefined;
  /** This range's facts, already loaded for the overview. */
  invoiced: InvoicedInPeriod;
  cash: CashInPeriod;
};

/**
 * The four headline figures of Financials as trends (ADR 0086): invoiced and received are sums,
 * outstanding and overdue are snapshots rebuilt from invoices, payments and refunds.
 */
export async function financeTrends({
  context,
  range,
  timeZone,
  now,
  customerId,
  ...current
}: FinanceTrendsInput): Promise<FinanceTrends> {
  const { size, buckets } = bucketsOf({ ...range, timeZone });
  const before = periodOf({ ...previousRange(range), timeZone });
  const end = periodOf({ ...range, timeZone }).end;
  const [invoiced, cash, history] = await Promise.all([
    loadInvoicedInPeriod({ context, period: before, customerId }),
    loadCashInPeriod({ context, period: before, customerId }),
    loadBalanceHistory({ context, end: end.getTime() < now.getTime() ? end : now, customerId }),
  ]);
  const balance = ({ overdueOnly }: { overdueOnly: boolean }) =>
    snapshotTrend({
      buckets,
      now,
      valueAt: ({ instant }) => openAt({ history, instant, overdueOnly }),
    });
  return {
    bucketSize: size,
    invoiced: sumTrend({
      buckets,
      facts: invoicedFacts({ invoiced: current.invoiced }),
      previous: invoicedFacts({ invoiced }),
    }),
    received: sumTrend({
      buckets,
      facts: cashFacts({ cash: current.cash }),
      previous: cashFacts({ cash }),
    }),
    outstanding: balance({ overdueOnly: false }),
    overdue: balance({ overdueOnly: true }),
  };
}
