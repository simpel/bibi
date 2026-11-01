import { missingVatRates } from "../../accounting/sie4/events";
import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { revenueAccountResolver, toAccountMap } from "./account-map";
import { type PendingEvent, pendingEvents } from "./export-events";
import type {
  AccountingExportPreviewDto,
  AccountingExportRangeInput,
  ExportBlocker,
} from "./export-schema";
import { loadExportSources } from "./export-sources";
import { loadAccountingSettings } from "./load-settings";
import { resolvePeriod } from "./period";

export type PlanExportInput = {
  context: Pick<OperationContext, "db">;
  input: AccountingExportRangeInput;
};

/**
 * Everything an export of the range needs, read once: settings, organization, zone and the events
 * dated in the range. VALIDATION for a range that is backwards or longer than the overview's.
 */
export async function planExport({ context, input }: PlanExportInput) {
  const resolved = await resolvePeriod({ context, input });
  if (!resolved.ok) return resolved;
  const { start, end, timeZone } = resolved.value;
  const period = { start, end };
  const [settings, profile, sources, earlierExports] = await Promise.all([
    loadAccountingSettings({ context }),
    context.db.organizationProfile.findFirst({ select: { legalName: true, orgNumber: true } }),
    loadExportSources({ context, period }),
    context.db.accountingExport.count({
      where: { periodStart: { lt: end }, periodEnd: { gt: start } },
    }),
  ]);
  const accountOf = revenueAccountResolver({ settings });
  const pending = await pendingEvents({ context, sources, timeZone, accountOf });
  const accounts = toAccountMap({ settings });
  return ok({
    value: { settings, profile, timeZone, period, earlierExports, pending, accounts },
  });
}

export type ExportPlan = Extract<Awaited<ReturnType<typeof planExport>>, { ok: true }>["value"];

/** Why the export cannot be created; empty when it can (ADR 0077). */
export function exportBlockers({ plan }: { plan: ExportPlan }): ExportBlocker[] {
  const events = plan.pending.map((pending) => pending.event);
  const missing = missingVatRates({ accounts: plan.accounts, events });
  return [
    ...(plan.profile?.orgNumber ? [] : [{ code: "ORG_NUMBER_MISSING" as const, detail: null }]),
    ...(missing.length > 0
      ? [
          {
            code: "VAT_ACCOUNT_MISSING" as const,
            detail: missing.map((rate) => `${rate} %`).join(", "),
          },
        ]
      : []),
    ...(events.length === 0 ? [{ code: "NOTHING_TO_EXPORT" as const, detail: null }] : []),
  ];
}

const KINDS = ["INVOICE_SENT", "INVOICE_VOID", "PAYMENT", "FEE", "REFUND"] as const;

/** The preview: how many vouchers of each kind, the date span and the blockers. */
export function previewOf({ plan }: { plan: ExportPlan }): AccountingExportPreviewDto {
  const dates = plan.pending.map(({ event }: PendingEvent) => event.date).sort();
  const counts = KINDS.map((kind) => ({
    kind,
    count: plan.pending.filter(({ entry }) => entry.kind === kind).length,
  })).filter((row) => row.count > 0);
  return {
    voucherCount: plan.pending.length,
    counts,
    firstDate: dates[0] ?? null,
    lastDate: dates.at(-1) ?? null,
    earlierExports: plan.earlierExports,
    blockers: exportBlockers({ plan }),
  };
}
