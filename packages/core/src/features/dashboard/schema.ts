import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";
import { BucketSizeSchema, TrendSchema } from "../../trend/trend-schema";
import { MAX_FINANCE_MONTHS } from "../finance/schema";
import { AttentionSchema, ScheduledSchema } from "./attention-schema";

/** How far ahead "Needs attention" looks for unsent sheets, in days from today (ADR 0080). */
export const DASHBOARD_HORIZON_DAYS = 28;
/** Holds expiring within this many days are listed as needing attention. */
export const EXPIRY_WARNING_DAYS = 7;
/** At most this many tickets in "scheduled". */
export const SCHEDULED_LIMIT = 50;

/** The range the Workload tab shows (ADR 0086); attention and the tiles' counts stay "now". */
export const DashboardSummaryInputSchema = z.object({
  from: PlainDateStringSchema.describe("First day of the range, YYYY-MM-DD (inclusive)"),
  to: PlainDateStringSchema.describe(
    `Last day of the range, YYYY-MM-DD (inclusive); at most ${MAX_FINANCE_MONTHS} months`,
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
  trend: TrendSchema.describe("Open tickets in the status at each bucket's end (ADR 0086)"),
});

export const BookedAheadMonthSchema = z.object({
  month: z.string().describe("Month of the event's first line, else of the acceptance, YYYY-MM"),
  valueExclVatMinor: minor({ what: "Accepted quotes on tickets not invoiced yet, excluding VAT" }),
  tickets: z.number().int().describe("How many tickets"),
});

export const UtilisationSchema = z.object({
  entityTypeId: z.string().describe("entityType.get"),
  name: z.string().describe("The item type name"),
  items: z.number().int().describe("Active bookable items of the type"),
  bookedMinutes: z.number().int().describe("Hold time inside open hours; overlaps count once"),
  openMinutes: z.number().int().describe("Open hours of the type's items in the range"),
  rate: z.number().nullable().describe("bookedMinutes / openMinutes, 0 to 1; null when closed"),
});

/**
 * The Workload tab (ADR 0079, 0080, 0086; a view read model, ADR 0071): open tickets per status
 * now with their trend over the range, what needs attention now, the tickets, utilisation and
 * accepted quotes not invoiced in the range. A part the caller may not read is null.
 */
export const DashboardSummarySchema = z.object({
  from: z.string().describe("First day of the range, YYYY-MM-DD"),
  to: z.string().describe("Last day of the range, YYYY-MM-DD (inclusive)"),
  currency: z.string(),
  timeZone: z.string(),
  bucketSize: BucketSizeSchema,
  statuses: z.array(StatusTileSchema).describe("Open statuses in position order"),
  attention: AttentionSchema,
  scheduled: z.array(ScheduledSchema).describe(`Soonest first, at most ${SCHEDULED_LIMIT}`),
  utilisation: z.array(UtilisationSchema).nullable().describe("Over the range; needs item:read"),
  bookedAhead: z
    .array(BookedAheadMonthSchema)
    .nullable()
    .describe("Accepted quotes not invoiced yet, per event month in the range; needs quote:read"),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type BookedAheadMonth = z.infer<typeof BookedAheadMonthSchema>;
/** The days a dashboard part covers, YYYY-MM-DD inclusive. */
export type DashboardWindow = { from: string; to: string };
