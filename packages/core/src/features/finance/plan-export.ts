import { missingVatRates } from "../../accounting/sie4/events";
import type { OperationContext } from "../../operations/types";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { revenueAccountResolver, toAccountMap } from "./account-map";
import { type PendingEvent, pendingEvents } from "./export-events";
import type { AccountingExportPreviewDto, ExportBlocker } from "./export-schema";
import { loadExportSources } from "./export-sources";
import { loadAccountingSettings } from "./load-settings";

type Db = { context: Pick<OperationContext, "db"> };

/** Everything the next export needs, read once: settings, organization, zone and its events. */
export async function planExport({ context }: Db) {
  const [settings, profile, zoneOf, sources] = await Promise.all([
    loadAccountingSettings({ context }),
    context.db.organizationProfile.findFirst({ select: { legalName: true, orgNumber: true } }),
    loadZoneOfVenue({ context }),
    loadExportSources({ context }),
  ]);
  const timeZone = zoneOf({ venue: null });
  const accountOf = revenueAccountResolver({ settings });
  const pending = await pendingEvents({ context, sources, timeZone, accountOf });
  const accounts = toAccountMap({ settings });
  return { settings, profile, timeZone, pending, accounts };
}

export type ExportPlan = Awaited<ReturnType<typeof planExport>>;

/** Why the export cannot be created yet; empty when it can (ADR 0077). */
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
    blockers: exportBlockers({ plan }),
  };
}
