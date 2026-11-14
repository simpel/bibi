import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";
import { ExpiringHoldSchema } from "../dashboard/attention-schema";
import { NotificationSchema } from "../notification/schema";
import { RUN_SHEET_STATUSES } from "../run-sheet/schema";

/** The longest period My work shows, in days (a week plus a weekend either side). */
export const MY_WORK_MAX_DAYS = 14;
/** To do looks at least this many days ahead, whatever the period. */
export const MY_WORK_TODO_DAYS = 7;
/** Run sheet rows per page unless the caller asks for another `limit`. */
export const MY_WORK_PAGE_SIZE = 25;
/** Each To do part lists at most this many, soonest first; `totals` counts them all. */
export const MY_WORK_TODO_LIMIT = 5;
/** The latest unread notifications shown under "What changed". */
export const MY_WORK_NOTIFICATION_LIMIT = 6;

export const MyWorkInputSchema = z.object({
  from: PlainDateStringSchema.describe("First day, YYYY-MM-DD (inclusive), e.g. today"),
  to: PlainDateStringSchema.describe(
    `Last day, YYYY-MM-DD (inclusive); at most ${MY_WORK_MAX_DAYS} days after from`,
  ),
  page: z.number().int().min(1).max(10_000).default(1).describe("Page of run sheet rows, from 1"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(MY_WORK_PAGE_SIZE)
    .describe("Run sheet rows per page"),
});
export type MyWorkInput = z.infer<typeof MyWorkInputSchema>;

/**
 * Why something concerns the caller (spec: assignments-and-responsibilities, "Concerns me").
 * ASSIGNEE/FOLLOWER: the order's main assignment. RESPONSIBILITY/RESPONSIBILITY_FOLLOWER: the
 * run sheet's responsibility on the order, chosen or by default. STAFFED: one of the caller's
 * staff items fills the line. ITEM: the caller is assignee or follower of the line's item.
 * RECIPIENT: the caller received a version of the run sheet.
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

const orderTitle = z.string().nullable().describe("The order's title; null until it has one");

export const MyWorkNeedSchema = z.object({
  name: z.string().describe("The counted list value, e.g. an allergen"),
  quantity: z.number().int().nullable(),
  scope: z.enum(["LINE", "ORDER"]).describe("Counted for this line, or for the whole order"),
  blocking: z.boolean().describe("An item on the line contains it (the run sheet is blocked)"),
});

/** One thing to prepare, run or set up: an item row of a current run sheet version. */
export const MyWorkRowSchema = z.object({
  key: z.string().describe("The row's key in the run sheet (the line id)"),
  runSheetId: z.string().describe("runSheet.get"),
  runSheetName: z.string().describe("The run sheet definition's name"),
  version: z.number().int(),
  status: z.enum(RUN_SHEET_STATUSES).describe("The run sheet's status (see runSheet.get)"),
  orderId: z.string().describe("order.get"),
  reference: z.number().int(),
  title: orderTitle,
  customerName: z.string().nullable().describe("Null without customer:read"),
  label: z.string().describe("The line's name"),
  itemName: z.string().nullable(),
  quantity: z.number().int().nullable(),
  at: z.date().describe("When it happens: the line's start, else the order's"),
  endsAt: z.date().nullable(),
  timed: z.boolean().describe("false: the line has no time and `at` is the order's start"),
  changed: z
    .array(z.string())
    .describe("Changed attributes since the last sent version; empty = none"),
  added: z.boolean().describe("The row is new since the last sent version"),
  needs: z.array(MyWorkNeedSchema),
  reasons: z
    .array(ConcernReasonSchema)
    .min(1)
    .describe("Why it concerns the caller, strongest first"),
});
export type MyWorkRow = z.infer<typeof MyWorkRowSchema>;

export const MyWorkRunSheetTaskSchema = z.object({
  runSheetId: z.string().describe("runSheet.get"),
  runSheetName: z.string(),
  version: z.number().int(),
  status: z
    .enum(["DRAFT", "REVISION_PENDING", "BLOCKED"])
    .describe("Not sent, changed since sent, blocked"),
  orderId: z.string().describe("order.get"),
  reference: z.number().int(),
  title: orderTitle,
  startsAt: z.date().describe("The order's first line start ahead"),
  reason: ConcernReasonSchema,
});

export const MyWorkQuoteSchema = z.object({
  quoteId: z.string().describe("quote.get"),
  orderId: z.string().describe("order.get"),
  reference: z.number().int(),
  title: orderTitle,
  version: z.number().int(),
  sentAt: z.date().describe("When the quote was sent"),
  validUntil: z.date().nullable(),
});

export const MyWorkMessagesSchema = z.object({
  orderId: z.string().describe("order.get"),
  reference: z.number().int(),
  title: orderTitle,
  unread: z.number().int().describe("Unread customer messages on the order"),
  latestAt: z.date(),
});

/** What the caller must act on: only where they are assignee, own a responsibility or are staffed. */
export const MyWorkTodoSchema = z.object({
  runSheets: z
    .array(MyWorkRunSheetTaskSchema)
    .nullable()
    .describe("Run sheets to send or unblock, soonest first; needs runSheet:read"),
  expiringHolds: z
    .array(ExpiringHoldSchema)
    .describe("The caller's orders whose holds run out soon; empty without order:read"),
  quotes: z
    .array(MyWorkQuoteSchema)
    .nullable()
    .describe("Sent quotes waiting on the customer; needs quote:read"),
  messages: z
    .array(MyWorkMessagesSchema)
    .nullable()
    .describe("Unread customer messages on the caller's orders; needs inbox:read"),
  totals: z
    .object({
      runSheets: z.number().int().nullable(),
      expiringHolds: z.number().int(),
      quotes: z.number().int().nullable(),
      messages: z.number().int().nullable(),
    })
    .describe(`How many of each there are; each list holds at most ${MY_WORK_TODO_LIMIT}`),
});

export const MyWorkSchema = z.object({
  from: PlainDateStringSchema,
  to: PlainDateStringSchema,
  timeZone: z.string(),
  rows: z
    .array(MyWorkRowSchema)
    .nullable()
    .describe(
      "One page of the run sheet rows in the period that concern the caller, by time; needs runSheet:read",
    ),
  page: z.number().int().describe("The page of rows returned, from 1"),
  limit: z.number().int().describe("Rows per page"),
  rowsTotal: z
    .number()
    .int()
    .describe("Rows in the period across all pages; 0 without runSheet:read"),
  todo: MyWorkTodoSchema,
  unreadNotifications: z.number().int(),
  notifications: z.array(NotificationSchema).describe("The latest unread notifications"),
});
export type MyWork = z.infer<typeof MyWorkSchema>;
export type MyWorkTodo = z.infer<typeof MyWorkTodoSchema>;
export type MyWorkMessages = z.infer<typeof MyWorkMessagesSchema>;
