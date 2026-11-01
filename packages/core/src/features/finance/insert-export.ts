import type { OperationContext } from "../../operations/types";
import type { AccountingExportDto } from "./export-schema";
import type { ExportPlan } from "./plan-export";

export const EXPORT_SELECT = {
  id: true,
  number: true,
  fileName: true,
  voucherCount: true,
  periodStart: true,
  periodEnd: true,
  createdAt: true,
  createdBy: true,
} as const;

export type InsertExportInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  plan: ExportPlan;
  bytes: Uint8Array;
};

/**
 * Writes the export, its range and one entry per event it contains (ADR 0077). Two exports at once
 * would take the same number; the unique key refuses the second, whole, with CONFLICT.
 */
export async function insertExport({
  context,
  plan,
  bytes,
}: InsertExportInput): Promise<AccountingExportDto> {
  const { organizationId } = context;
  const last = await context.db.accountingExport.aggregate({ _max: { number: true } });
  const number = (last._max.number ?? 0) + 1;
  const row = await context.db.accountingExport.create({
    data: {
      organizationId,
      number,
      fileName: `bibi-sie-${String(number).padStart(4, "0")}.si`,
      fileBytes: Uint8Array.from(bytes),
      voucherCount: plan.pending.length,
      periodStart: plan.period.start,
      periodEnd: plan.period.end,
    },
    select: EXPORT_SELECT,
  });
  await context.db.accountingExportEntry.createMany({
    data: plan.pending.map(({ entry }) => ({ ...entry, organizationId, exportId: row.id })),
  });
  return row;
}
