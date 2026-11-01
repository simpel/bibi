import type { OpenInvoice } from "./load-facts";
import type { FinanceAging } from "./schema";

const DAY_MS = 86_400_000;
const OVERDUE_LISTED = 10;

export type AgingInput = {
  open: readonly OpenInvoice[];
  now: Date;
  /** The ticket reference, or null for a caller without `ticket:read`. */
  referenceOf: (input: { reference: number }) => number | null;
};

/** Whole days past the due date; 0 or less when not due (no due date counts as not due). */
export const daysOverdue = ({ dueDate, now }: { dueDate: Date | null; now: Date }) =>
  dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / DAY_MS) : 0;

/** What is open today, bucketed by how late it is, with the most overdue invoices listed. */
export function aging({ open, now, referenceOf }: AgingInput): FinanceAging {
  const result: FinanceAging = {
    notDueMinor: 0,
    overdue1to30Minor: 0,
    overdue31to60Minor: 0,
    overdue61PlusMinor: 0,
    overdue: [],
  };
  const late = open.map((row) => ({ row, days: daysOverdue({ dueDate: row.dueDate, now }) }));
  for (const { row, days } of late) {
    if (days <= 0) result.notDueMinor += row.openMinor;
    else if (days <= 30) result.overdue1to30Minor += row.openMinor;
    else if (days <= 60) result.overdue31to60Minor += row.openMinor;
    else result.overdue61PlusMinor += row.openMinor;
  }
  result.overdue = late
    .filter(({ days, row }) => days > 0 && row.dueDate)
    .sort((a, b) => b.days - a.days)
    .slice(0, OVERDUE_LISTED)
    .map(({ row, days }) => ({
      invoiceId: row.id,
      number: row.number,
      ticketId: row.ticketId,
      ticketReference: referenceOf({ reference: row.ticket.reference }),
      dueDate: row.dueDate as Date,
      daysOverdue: days,
      openMinor: row.openMinor,
    }));
  return result;
}
