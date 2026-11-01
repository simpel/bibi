import { financeOverview, listCustomers } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { financeToday } from "../finance-path";
import { loadExportData } from "../lib/load-export-data";
import { FinancialsView } from "./financials-view";

export type FinancialsPageProps = {
  locale: Locale;
  from: string;
  to: string;
  customerId?: string | undefined;
};

const CUSTOMER_LIMIT = 100;

/** `/financials/{from}/{to}`: KPIs, charts, overdue invoices, VAT and the SIE export (ADR 0077). */
export async function FinancialsPage({ locale, from, to, customerId }: FinancialsPageProps) {
  const abilities = await getCallerAbilities();
  const canListCustomers = can({ abilities, permission: "customer:read" });
  const [numbers, dates, today, overview, customers, exportData] = await Promise.all([
    getNumberFormat(),
    getDateTimeFormat(),
    financeToday(),
    runOperation({
      operation: financeOverview,
      input: { from, to, ...(customerId ? { customerId } : {}) },
    }),
    canListCustomers
      ? runOperation({ operation: listCustomers, input: { limit: CUSTOMER_LIMIT } })
      : null,
    loadExportData(),
  ]);
  const { preview, exports } = exportData;
  const fail = ({ error }: { error: Parameters<typeof handleLoadError>[0]["error"] }) => (
    <ErrorState errorKey={handleLoadError({ error, locale })} />
  );
  if (!overview.ok) return fail({ error: overview.error });
  if (!preview.ok) return fail({ error: preview.error });
  if (!exports.ok) return fail({ error: exports.error });
  return (
    <FinancialsView
      overview={overview.value}
      preview={preview.value}
      exports={exports.value.items}
      today={today}
      dates={dates}
      numbers={numbers}
      canWrite={can({ abilities, permission: "finance:write" })}
      customers={customers?.ok ? customers.value.items.map(({ id, name }) => ({ id, name })) : []}
      customerId={customerId}
    />
  );
}
