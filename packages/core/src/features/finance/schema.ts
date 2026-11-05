import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";
import { BucketSizeSchema, TrendSchema } from "../../trend/trend-schema";

/** The longest period one overview covers, in months (ADR 0077). */
export const MAX_FINANCE_MONTHS = 24;

export const FinanceOverviewInputSchema = z.object({
  from: PlainDateStringSchema.describe("First day of the period, YYYY-MM-DD (inclusive)"),
  to: PlainDateStringSchema.describe(
    `Last day of the period, YYYY-MM-DD (inclusive); at most ${MAX_FINANCE_MONTHS} months`,
  ),
  customerId: z
    .string()
    .optional()
    .describe("Only this customer's orders, invoices and payments (customer.list)"),
});

const minor = ({ what }: { what: string }) => z.number().int().describe(`${what}, minor units`);

const MonthSchema = z.string().describe("Calendar month in the organization's zone, YYYY-MM");

export const FinanceMonthSchema = z.object({
  month: MonthSchema,
  invoicedExclVatMinor: minor({ what: "Invoices sent in the month, excluding VAT" }),
  receivedMinor: minor({ what: "Payments received in the month minus refunds made in it" }),
});

export const OverdueInvoiceSchema = z.object({
  invoiceId: z.string().describe("invoice.get"),
  number: z.number().int(),
  orderId: z.string().describe("order.get"),
  orderReference: z.number().int().nullable().describe("null without order:read"),
  orderTitle: z.string().nullable().describe("null without order:read or a title"),
  dueDate: z.date(),
  daysOverdue: z.number().int(),
  openMinor: minor({ what: "Still owed" }),
});

export const FinanceAgingSchema = z.object({
  notDueMinor: minor({ what: "Open on invoices not yet due" }),
  overdue1to30Minor: minor({ what: "Open, 1 to 30 days overdue" }),
  overdue31to60Minor: minor({ what: "Open, 31 to 60 days overdue" }),
  overdue61PlusMinor: minor({ what: "Open, more than 60 days overdue" }),
  overdue: z.array(OverdueInvoiceSchema).describe("The most overdue invoices, at most 10"),
});

export const OutcomeMonthSchema = z.object({
  month: MonthSchema,
  wonOrders: z
    .number()
    .int()
    .describe("Orders that closed with an accepted quote or a sent invoice"),
  wonValueMinor: minor({ what: "Their accepted quote totals excl. VAT, else their estimates" }),
  lostOrders: z.number().int().describe("Orders that closed with neither"),
  lostValueMinor: minor({ what: "Their estimates excl. VAT" }),
});

export const RevenueByTypeSchema = z.object({
  entityTypeId: z.string().nullable().describe("The item type; null for lines without an item"),
  name: z.string().nullable(),
  invoicedExclVatMinor: minor({ what: "Invoiced in the period, excluding VAT" }),
});

export const VatByRateSchema = z.object({
  vatRatePercent: z.number().int(),
  totalExclVatMinor: minor({ what: "Invoiced at this rate, excluding VAT" }),
  vatMinor: minor({ what: "Output VAT at this rate" }),
});

/** The headline figures as trends over the range (ADR 0086); needs `payment:read`. */
export const FinanceTrendsSchema = z.object({
  bucketSize: BucketSizeSchema,
  invoiced: TrendSchema.describe("Invoiced excl. VAT, a sum per bucket"),
  received: TrendSchema.describe("Received, refunds subtracted, a sum per bucket"),
  outstanding: TrendSchema.describe("Open on sent invoices at each bucket's end"),
  overdue: TrendSchema.describe("Open and past due at each bucket's end"),
});

/**
 * The organization's money for a period (ADR 0077, a view read model, ADR 0071): everything is
 * derived on read. Invoices and payments need `payment:read`, won and lost orders `quote:read`;
 * a part the caller may not read is null. What is booked ahead is `dashboard.summary` (ADR 0080).
 */
export const FinanceOverviewSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string(),
  timeZone: z.string(),
  invoicedExclVatMinor: minor({ what: "Invoiced in the period, excluding VAT" }).nullable(),
  receivedMinor: minor({ what: "Received in the period, refunds subtracted" }).nullable(),
  outstandingMinor: minor({ what: "Open on every sent invoice today" }).nullable(),
  overdueMinor: minor({ what: "Open on sent invoices past their due date today" }).nullable(),
  monthly: z.array(FinanceMonthSchema).nullable(),
  aging: FinanceAgingSchema.nullable(),
  outcomes: z
    .array(OutcomeMonthSchema)
    .nullable()
    .describe("Orders won and lost per month; needs quote:read"),
  revenueByType: z.array(RevenueByTypeSchema).nullable(),
  vatByRate: z.array(VatByRateSchema).nullable(),
  trends: FinanceTrendsSchema.nullable().describe("Needs payment:read"),
});

export type FinanceOverviewInput = z.infer<typeof FinanceOverviewInputSchema>;
export type FinanceOverviewDto = z.infer<typeof FinanceOverviewSchema>;
export type FinanceMonth = z.infer<typeof FinanceMonthSchema>;
export type FinanceAging = z.infer<typeof FinanceAgingSchema>;
export type OutcomeMonth = z.infer<typeof OutcomeMonthSchema>;
export type FinanceTrends = z.infer<typeof FinanceTrendsSchema>;
export type RevenueByType = z.infer<typeof RevenueByTypeSchema>;
export type VatByRate = z.infer<typeof VatByRateSchema>;
