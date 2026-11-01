import { ok } from "../../errors/result";
import { DEFAULT_CURRENCY } from "../../number/number-formats";
import { defineOperation } from "../../operations/define-operation";
import { canView } from "../../shared/can-view";
import { visibleTo } from "../../shared/visible-to";
import { monthly, revenueByType, vatByRate } from "./aggregate";
import { aging } from "./aging";
import {
  accountingExportOperations,
  createAccountingExport,
  downloadAccountingExport,
  getAccountingExport,
  listAccountingExports,
  previewAccountingExport,
} from "./export-operations";
import { forwardBooked } from "./forward-booked";
import {
  loadCashInPeriod,
  loadForwardBooked,
  loadInvoicedInPeriod,
  loadOpenInvoices,
} from "./load-facts";
import { resolvePeriod } from "./period";
import { FinanceOverviewInputSchema, FinanceOverviewSchema } from "./schema";
import { getAccountingSettings, updateAccountingSettings } from "./settings-operations";

const sum = ({ values }: { values: readonly number[] }) => values.reduce((a, b) => a + b, 0);

/**
 * The organization's money for a period (ADR 0077): invoiced, received, outstanding, aging,
 * forward-booked value, revenue per item type and VAT per rate. A view read model (ADR 0071):
 * invoices and payments need `payment:read`, quotes `quote:read`; nothing is stored.
 */
export const financeOverview = defineOperation({
  name: "finance.overview",
  kind: "query",
  description:
    "The organization's money for a period: invoiced and received per month, open and overdue invoices, accepted quotes not invoiced yet, revenue per item type and VAT per rate.",
  input: FinanceOverviewInputSchema,
  output: FinanceOverviewSchema,
  permission: "finance:read",
  handler: async ({ input, context }) => {
    const resolved = await resolvePeriod({ context, input });
    if (!resolved.ok) return resolved;
    const period = resolved.value;
    const money = canView({ context, feature: "payment" });
    const quotes = canView({ context, feature: "quote" });
    const { customerId } = input;
    const [invoiced, cash, open, won] = await Promise.all([
      money ? loadInvoicedInPeriod({ context, period, customerId }) : [],
      money ? loadCashInPeriod({ context, period, customerId }) : { payments: [], refunds: [] },
      money ? loadOpenInvoices({ context, customerId }) : [],
      quotes ? loadForwardBooked({ context, customerId }) : [],
    ]);
    const months = monthly({ ...period, invoiced, cash });
    const referenceOf = ({ reference }: { reference: number }) =>
      visibleTo({ context, feature: "ticket", value: reference });
    const late = aging({ open, now: new Date(), referenceOf });
    const overdueMinor = late.overdue1to30Minor + late.overdue31to60Minor + late.overdue61PlusMinor;
    const gate = <T>({ value }: { value: T }) => visibleTo({ context, feature: "payment", value });
    return ok({
      value: {
        from: input.from,
        to: input.to,
        currency: DEFAULT_CURRENCY,
        timeZone: period.timeZone,
        invoicedExclVatMinor: gate({
          value: sum({ values: months.map((m) => m.invoicedExclVatMinor) }),
        }),
        receivedMinor: gate({ value: sum({ values: months.map((m) => m.receivedMinor) }) }),
        outstandingMinor: gate({ value: sum({ values: open.map((row) => row.openMinor) }) }),
        overdueMinor: gate({ value: overdueMinor }),
        monthly: gate({ value: months }),
        aging: gate({ value: late }),
        forwardBooked: visibleTo({
          context,
          feature: "quote",
          value: forwardBooked({ quotes: won, monthOf: period.monthOf }),
        }),
        revenueByType: gate({ value: revenueByType({ invoiced }) }),
        vatByRate: gate({ value: vatByRate({ invoiced }) }),
      },
    });
  },
});

/** The financials and the accounts of their SIE export (ADR 0077). */
export const financeOperations = [
  financeOverview,
  getAccountingSettings,
  updateAccountingSettings,
  ...accountingExportOperations,
];

export {
  createAccountingExport,
  downloadAccountingExport,
  getAccountingExport,
  getAccountingSettings,
  listAccountingExports,
  previewAccountingExport,
  updateAccountingSettings,
};
