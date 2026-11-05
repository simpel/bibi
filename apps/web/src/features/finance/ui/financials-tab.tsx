import { financeOverview, listCustomers } from "@bibi/core";
import type { PlainDate } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import type { Period } from "../lib/finance-period";
import { loadExportData } from "../lib/load-export-data";
import { FinancialsView } from "./financials-view";

export type FinancialsTabProps = {
  locale: Locale;
  period: Period;
  today: PlainDate;
  customerId?: string | undefined;
};

const CUSTOMER_LIMIT = 100;

/** The Financials tab (ADR 0077, 0086): its stat cards, charts, tables and the SIE export. */
export async function FinancialsTab({ locale, period, today, customerId }: FinancialsTabProps) {
  const abilitiesPending = getCallerAbilities();
  const [numbers, dates, overview, customers, exports] = await Promise.all([
    getNumberFormat(),
    getDateTimeFormat(),
    runOperation({
      operation: financeOverview,
      input: { ...period, ...(customerId ? { customerId } : {}) },
    }),
    abilitiesPending.then((abilities) =>
      can({ abilities, permission: "customer:read" })
        ? runOperation({ operation: listCustomers, input: { limit: CUSTOMER_LIMIT } })
        : null,
    ),
    loadExportData(),
  ]);
  const abilities = await abilitiesPending;
  if (!overview.ok)
    return <ErrorState errorKey={handleLoadError({ error: overview.error, locale })} />;
  if (!exports.ok)
    return <ErrorState errorKey={handleLoadError({ error: exports.error, locale })} />;
  return (
    <FinancialsView
      {...{ today, dates, numbers, customerId }}
      overview={overview.value}
      exports={exports.value.items}
      canWrite={can({ abilities, permission: "finance:write" })}
      customers={customers?.ok ? customers.value.items.map(({ id, name }) => ({ id, name })) : []}
    />
  );
}
