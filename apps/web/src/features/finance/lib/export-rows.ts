import type { AccountingExportDto, DateTimeFormat } from "@bibi/core/schemas";

export type ExportRow = {
  id: string;
  number: number;
  /** ISO instant, sorts as a date. */
  createdAt: string;
  dateText: string;
  voucherCount: number;
  fileName: string;
};

export type ExportRowsInput = { exports: AccountingExportDto[]; dates: DateTimeFormat };

export function exportRows({ exports, dates }: ExportRowsInput): ExportRow[] {
  return exports.map((row) => ({
    id: row.id,
    number: row.number,
    createdAt: row.createdAt.toISOString(),
    dateText: dates.dateTime({ instant: row.createdAt }),
    voucherCount: row.voucherCount,
    fileName: row.fileName,
  }));
}
