import {
  type AccountingSettingsDto,
  AccountingSettingsSchema,
  type FinanceAging,
  FinanceAgingSchema,
  type FinanceMonth,
  FinanceMonthSchema,
  type FinanceOverviewDto,
  type FinanceTrends,
  financeOverview,
  getAccountingSettings,
  type OutcomeMonth,
  OutcomeMonthSchema,
  OverdueInvoiceSchema,
  type RevenueAccountDto,
  RevenueAccountSchema,
  type RevenueByType,
  RevenueByTypeSchema,
  updateAccountingSettings,
  type VatByRate,
  VatByRateSchema,
} from "@bibi/core";
import type { z } from "zod";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { TrendRef } from "../../schema/trend";

type OverdueInvoice = z.infer<typeof OverdueInvoiceSchema>;

const MonthRef = objectFromSchema<FinanceMonth>({
  name: "FinanceMonth",
  schema: FinanceMonthSchema,
  description: "Invoiced and received money in one month.",
});
const OverdueRef = objectFromSchema<OverdueInvoice>({
  name: "OverdueInvoice",
  schema: OverdueInvoiceSchema,
  description: "A sent invoice past its due date with money still open.",
});
const AgingRef = builder.objectRef<FinanceAging>("FinanceAging").implement({
  description: FinanceAgingSchema.description ?? "Open invoice money by how late it is.",
  fields: (t) => ({
    notDueMinor: t.exposeInt("notDueMinor"),
    overdue1to30Minor: t.exposeInt("overdue1to30Minor"),
    overdue31to60Minor: t.exposeInt("overdue31to60Minor"),
    overdue61PlusMinor: t.exposeInt("overdue61PlusMinor"),
    overdue: t.field({ type: [OverdueRef], resolve: (aging) => aging.overdue }),
  }),
});
const OutcomeRef = objectFromSchema<OutcomeMonth>({
  name: "FinanceOutcomeMonth",
  schema: OutcomeMonthSchema,
  description: "Orders won and lost in one month.",
});
const RevenueRef = objectFromSchema<RevenueByType>({
  name: "RevenueByType",
  schema: RevenueByTypeSchema,
  description: "Invoiced money for one item type.",
});
const VatRef = objectFromSchema<VatByRate>({
  name: "VatByRate",
  schema: VatByRateSchema,
  description: "Invoiced money and output VAT at one rate.",
});

const TrendsRef = builder.objectRef<FinanceTrends>("FinanceTrends").implement({
  description: "Financials' headline figures as trends over the range (ADR 0086).",
  fields: (t) => ({
    bucketSize: t.exposeString("bucketSize"),
    invoiced: t.field({ type: TrendRef, resolve: (trends) => trends.invoiced }),
    received: t.field({ type: TrendRef, resolve: (trends) => trends.received }),
    outstanding: t.field({ type: TrendRef, resolve: (trends) => trends.outstanding }),
    overdue: t.field({ type: TrendRef, resolve: (trends) => trends.overdue }),
  }),
});

const FinanceOverviewRef = builder.objectRef<FinanceOverviewDto>("FinanceOverview").implement({
  description:
    "The organization's money for a period (ADR 0077). Parts the caller may not read are null.",
  fields: (t) => ({
    from: t.exposeString("from"),
    to: t.exposeString("to"),
    currency: t.exposeString("currency"),
    timeZone: t.exposeString("timeZone"),
    invoicedExclVatMinor: t.exposeInt("invoicedExclVatMinor", { nullable: true }),
    receivedMinor: t.exposeInt("receivedMinor", { nullable: true }),
    outstandingMinor: t.exposeInt("outstandingMinor", { nullable: true }),
    overdueMinor: t.exposeInt("overdueMinor", { nullable: true }),
    monthly: t.field({ type: [MonthRef], nullable: true, resolve: (o) => o.monthly }),
    aging: t.field({ type: AgingRef, nullable: true, resolve: (o) => o.aging }),
    revenueByType: t.field({ type: [RevenueRef], nullable: true, resolve: (o) => o.revenueByType }),
    vatByRate: t.field({ type: [VatRef], nullable: true, resolve: (o) => o.vatByRate }),
    outcomes: t.field({ type: [OutcomeRef], nullable: true, resolve: (o) => o.outcomes }),
    trends: t.field({ type: TrendsRef, nullable: true, resolve: (o) => o.trends }),
  }),
});

fieldFromOperation({
  operation: financeOverview,
  type: FinanceOverviewRef,
  name: "financeOverview",
});

const RevenueAccountRef = objectFromSchema<RevenueAccountDto>({
  name: "RevenueAccount",
  schema: RevenueAccountSchema,
  description: "The revenue account of one item type or one item (ADR 0077).",
});

const AccountingSettingsRef = objectFromSchema<AccountingSettingsDto>({
  name: "AccountingSettings",
  schema: AccountingSettingsSchema,
  omit: ["revenueAccounts"],
  description: "The accounts the SIE export posts to (ADR 0077); BAS defaults until saved.",
});

builder.objectField(AccountingSettingsRef, "revenueAccounts", (t) =>
  t.field({
    type: [RevenueAccountRef],
    description: AccountingSettingsSchema.shape.revenueAccounts.description,
    resolve: (settings) => settings.revenueAccounts,
  }),
);

fieldFromOperation({
  operation: getAccountingSettings,
  type: AccountingSettingsRef,
  name: "accountingSettings",
});
mutationFromOperation({ operation: updateAccountingSettings, type: AccountingSettingsRef });
