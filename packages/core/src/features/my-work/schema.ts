import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";

/** The longest period My work shows at once, in days. */
export const MY_WORK_MAX_DAYS = 14;

export const MyWorkInputSchema = z.object({
  from: PlainDateStringSchema.describe("First day, YYYY-MM-DD (inclusive), e.g. today"),
  to: PlainDateStringSchema.describe(
    `Last day, YYYY-MM-DD (inclusive); at most ${MY_WORK_MAX_DAYS} days after from`,
  ),
});
export type MyWorkInput = z.infer<typeof MyWorkInputSchema>;

/**
 * Why something concerns the caller (spec: assignments-and-responsibilities, "Concerns me").
 * ASSIGNEE/FOLLOWER: the order's main assignment. RESPONSIBILITY/RESPONSIBILITY_FOLLOWER: a
 * responsibility on the order, chosen or by default. STAFFED: one of the caller's staff items
 * fills a line. ITEM: the caller is assignee or follower of a line's item. RECIPIENT: the caller
 * received a version of one of the order's run sheets.
 */
export const CONCERN_REASONS = [
  "ASSIGNEE",
  "RESPONSIBILITY",
  "STAFFED",
  "ITEM",
  "FOLLOWER",
  "RESPONSIBILITY_FOLLOWER",
  "RECIPIENT",
] as const;
export const ConcernReasonSchema = z.enum(CONCERN_REASONS);
export type ConcernReason = z.infer<typeof ConcernReasonSchema>;

/** Most urgent first; a card's flags come in this order. */
export const MY_WORK_FLAG_KINDS = [
  "HARD_CLASH",
  "RUN_SHEET",
  "HOLD_EXPIRES",
  "QUOTE_WAITING",
  "UNREAD_MESSAGES",
] as const;

/**
 * Something on the card to look at. HARD_CLASH: one of the day's soft-held lines is overlapped by
 * another order's hard hold or a manual block (`reference` is that order's, null for a block).
 * The rest only reach the member who acts on the order: RUN_SHEET (not sent, changed since sent,
 * or blocked by a need match), HOLD_EXPIRES (`at` = the order's holdsUntil), QUOTE_WAITING
 * (`at` = when it was sent) and UNREAD_MESSAGES (`count`).
 */
export const MyWorkFlagSchema = z.object({
  kind: z.enum(MY_WORK_FLAG_KINDS),
  runSheetId: z.string().nullable().describe("runSheet.get; RUN_SHEET only"),
  runSheetName: z.string().nullable(),
  runSheetStatus: z.enum(["DRAFT", "REVISION_PENDING", "BLOCKED"]).nullable(),
  quoteId: z.string().nullable().describe("quote.get; QUOTE_WAITING only"),
  reference: z.number().int().nullable().describe("HARD_CLASH: the blocking order's reference"),
  at: z.date().nullable(),
  count: z.number().int().nullable(),
});
export type MyWorkFlag = z.infer<typeof MyWorkFlagSchema>;

/** One order on one day it has lines that concern the caller. */
export const MyWorkCardSchema = z.object({
  key: z.string().describe("`<orderId>:<day>`"),
  orderId: z.string().describe("order.get"),
  reference: z.number().int(),
  title: z.string().nullable().describe("The order's title; null until it has one"),
  customerName: z.string().nullable().describe("Null without customer:read"),
  status: z
    .object({ name: z.string(), color: z.string() })
    .nullable()
    .describe("The order's status; null without pipeline:read"),
  day: PlainDateStringSchema.describe("The day, in the organization's zone"),
  dayIndex: z.number().int().describe("1-based among the days the order has timed lines"),
  dayCount: z.number().int(),
  startsAt: z.date().describe("The first of the day's lines starts"),
  endsAt: z.date().describe("The last of the day's lines ends"),
  headcount: z.number().int().nullable().describe("Guaranteed, else estimated"),
  places: z
    .array(z.string())
    .nullable()
    .describe("The day's bookable items, e.g. rooms; null without item:read"),
  hold: z
    .enum(["HARD", "SOFT"])
    .nullable()
    .describe("The day's strongest hold; null when nothing is held"),
  reasons: z
    .array(ConcernReasonSchema)
    .min(1)
    .describe("Why it concerns the caller, strongest first"),
  flags: z.array(MyWorkFlagSchema).describe("Most urgent first"),
});
export type MyWorkCard = z.infer<typeof MyWorkCardSchema>;

export const MyWorkSchema = z.object({
  from: PlainDateStringSchema,
  to: PlainDateStringSchema,
  timeZone: z.string(),
  now: z.date().describe("The instant the cards were read at, for live and done"),
  next: PlainDateStringSchema.nullable().describe(
    "The first day after `to` (within a year) with a card, to read on from; null when none",
  ),
  cards: z
    .array(MyWorkCardSchema)
    .nullable()
    .describe("Cards by start, then reference; null without order:read"),
});
export type MyWork = z.infer<typeof MyWorkSchema>;
