import type { DateTimeFormat, FinanceAging, NumberFormat, VatByRate } from "@bibi/core/schemas";
import { plainDayText } from "./plain-day";

export type OverdueRow = {
  invoiceId: string;
  invoiceLabel: string;
  ticketId: string;
  ticketLabel: string;
  dueDateText: string;
  /** `YYYY-MM-DD`, sorts as a date. */
  dueDate: string;
  daysOverdue: number;
  openMinor: number;
  openText: string;
};

export type OverdueLabels = {
  invoice: (values: { number: number }) => string;
  ticket: (values: { reference: number | null }) => string;
};

export type OverdueRowsInput = {
  overdue: FinanceAging["overdue"];
  currency: string;
  timeZone: string;
  dates: DateTimeFormat;
  numbers: NumberFormat;
  labels: OverdueLabels;
};

/** A due date is a plain day (see `plainDayText`). */
export function overdueRows({
  overdue,
  currency,
  timeZone,
  dates,
  numbers,
  labels,
}: OverdueRowsInput): OverdueRow[] {
  return overdue.map((row) => {
    const dueDate = new Date(row.dueDate).toISOString().slice(0, 10);
    return {
      invoiceId: row.invoiceId,
      invoiceLabel: labels.invoice({ number: row.number }),
      ticketId: row.ticketId,
      ticketLabel: labels.ticket({ reference: row.ticketReference }),
      dueDateText: plainDayText({ day: dueDate, timeZone, dates }),
      dueDate,
      daysOverdue: row.daysOverdue,
      openMinor: row.openMinor,
      openText: numbers.money({ minor: row.openMinor, currency }),
    };
  });
}

export type VatRow = {
  rate: number;
  rateText: string;
  totalMinor: number;
  totalText: string;
  vatMinor: number;
  vatText: string;
};

export type VatRowsInput = {
  vatByRate: VatByRate[];
  currency: string;
  numbers: NumberFormat;
};

export function vatRows({ vatByRate, currency, numbers }: VatRowsInput): VatRow[] {
  return vatByRate.map((row) => ({
    rate: row.vatRatePercent,
    rateText: `${numbers.number({ value: row.vatRatePercent })} %`,
    totalMinor: row.totalExclVatMinor,
    totalText: numbers.money({ minor: row.totalExclVatMinor, currency }),
    vatMinor: row.vatMinor,
    vatText: numbers.money({ minor: row.vatMinor, currency }),
  }));
}
