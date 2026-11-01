import { z } from "zod";
import { AttentionSchema, ComingUpSchema } from "./attention-schema";

/** How far ahead the dashboard looks, in days from today (ADR 0080). */
export const DASHBOARD_HORIZON_DAYS = 28;
/** Holds expiring within this many days are listed as needing attention. */
export const EXPIRY_WARNING_DAYS = 7;
/** At most this many tickets in "coming up". */
export const COMING_UP_LIMIT = 50;

/** No input: the dashboard is always now and the next 28 days (ADR 0080). */
export const DashboardSummaryInputSchema = z.object({});

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
  openMinutes: z.number().int().describe("Open hours of the type's items in the horizon"),
  rate: z.number().nullable().describe("bookedMinutes / openMinutes, 0 to 1; null when closed"),
});

/**
 * The dashboard (ADR 0079, 0080; a view read model, ADR 0071): open tickets per status now, what
 * needs attention, what is coming up, utilisation and accepted quotes not invoiced, over today and
 * the next 28 days. A part the caller may not read is null. The past is `finance.overview`.
 */
export const DashboardSummarySchema = z.object({
  from: z.string().describe("Today in the organization's zone, YYYY-MM-DD"),
  to: z.string().describe("The horizon's last day, YYYY-MM-DD (inclusive)"),
  currency: z.string(),
  timeZone: z.string(),
  statuses: z.array(StatusTileSchema).describe("Open statuses in position order"),
  attention: AttentionSchema,
  comingUp: z.array(ComingUpSchema).describe(`Soonest first, at most ${COMING_UP_LIMIT}`),
  utilisation: z.array(UtilisationSchema).nullable().describe("Over the horizon; needs item:read"),
  bookedAhead: z
    .array(BookedAheadMonthSchema)
    .nullable()
    .describe("Accepted quotes not invoiced yet, per event month; needs quote:read"),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type BookedAheadMonth = z.infer<typeof BookedAheadMonthSchema>;
/** The days a dashboard part covers, YYYY-MM-DD inclusive. */
export type DashboardWindow = { from: string; to: string };
