import type { AccountingExportDto, DateTimeFormat } from "@bibi/core/schemas";

export type ExportRow = {
  id: string;
  number: number;
  /** ISO instant, sorts as a date. */
  createdAt: string;
  dateText: string;
  /** The reported range, or "–" for files made before ranges. */
  rangeText: string;
  voucherCount: number;
  fileName: string;
};

export type ExportRowsInput = { exports: AccountingExportDto[]; dates: DateTimeFormat };

type RangeTextInput = { row: AccountingExportDto; dates: DateTimeFormat };

/** `periodEnd` is exclusive: its last day is the one before. */
function rangeText({ row, dates }: RangeTextInput): string {
  if (!row.periodStart || !row.periodEnd) return "–";
  const end = new Date(row.periodEnd.getTime() - 1);
  return dates.dateRange({ start: row.periodStart, end, year: true });
}

export function exportRows({ exports, dates }: ExportRowsInput): ExportRow[] {
  return exports.map((row) => ({
    id: row.id,
    number: row.number,
    createdAt: row.createdAt.toISOString(),
    dateText: dates.dateTime({ instant: row.createdAt }),
    rangeText: rangeText({ row, dates }),
    voucherCount: row.voucherCount,
    fileName: row.fileName,
  }));
}
