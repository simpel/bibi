import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";
import { MAX_FINANCE_MONTHS } from "../finance/schema";

export const DashboardSummaryInputSchema = z.object({
  from: PlainDateStringSchema.describe("First day of the period, YYYY-MM-DD (inclusive)"),
  to: PlainDateStringSchema.describe(
    `Last day of the period, YYYY-MM-DD (inclusive); at most ${MAX_FINANCE_MONTHS} months`,
  ),
});
export type DashboardSummaryInput = z.infer<typeof DashboardSummaryInputSchema>;

const minor = ({ what }: { what: string }) => z.number().int().describe(`${what}, minor units`);

export const StatusTileSchema = z.object({
  statusId: z.string().describe("The ticket status id"),
  name: z.string().describe("The status name"),
  color: z.string().describe("The status colour"),
  tickets: z.number().int().describe("Open tickets in the status now"),
  estimatedValueMinor: minor({
    what: "Estimated value excl. VAT of the tickets without an accepted quote",
  })
    .nullable()
    .describe("Null when none has an estimate or priced lines (priced lines need program:read)"),
  confirmedValueMinor: minor({ what: "Accepted quotes' totals excl. VAT of those tickets" })
    .nullable()
    .describe("Null without an accepted quote or quote:read"),
});

export const OutcomeMonthSchema = z.object({
  month: z.string().describe("Calendar month in the organization's zone, YYYY-MM"),
  wonTickets: z
    .number()
    .int()
    .describe("Tickets that closed with an accepted quote or a sent invoice"),
  wonValueMinor: minor({ what: "Their accepted quote totals excl. VAT, else their estimates" }),
  lostTickets: z.number().int().describe("Tickets that closed with neither"),
  lostValueMinor: minor({ what: "Their estimates excl. VAT" }),
});

export const UtilisationSchema = z.object({
  entityTypeId: z.string().describe("entityType.get"),
  name: z.string().describe("The item type name"),
  items: z.number().int().describe("Active bookable items of the type"),
  bookedMinutes: z.number().int().describe("Hold time inside open hours; overlaps count once"),
  openMinutes: z.number().int().describe("Open hours of the type's items in the period"),
  rate: z.number().nullable().describe("bookedMinutes / openMinutes, 0 to 1; null when closed"),
});

/**
 * The dashboard (ADR 0079, a view read model, ADR 0071): open tickets per status now, won and
 * lost per month and utilisation per item type for the period. Outcomes need `quote:read`,
 * utilisation `item:read`; a part the caller may not read is null. Money is `finance.overview`.
 */
export const DashboardSummarySchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string(),
  timeZone: z.string(),
  statuses: z.array(StatusTileSchema).describe("Open statuses in position order"),
  outcomes: z.array(OutcomeMonthSchema).nullable().describe("One row per month; needs quote:read"),
  utilisation: z.array(UtilisationSchema).nullable().describe("Needs item:read"),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
