import { z } from "zod";
import { LineIssueKindSchema } from "../order/plan/issue-schema";

/** What the member must do (spec: home, "Needs you"); the order of the table in the spec. */
export const MY_WORK_TASK_KINDS = [
  "HARD_CLASH",
  "RUN_SHEET_BLOCKED",
  "LINE_ISSUE",
  "RUN_SHEET_UNSENT",
  "UNCONFIRMED",
  "HOLD_EXPIRES",
  "UNREAD_MESSAGES",
  "PAYMENT_OVERDUE",
  "NOT_CLOSED",
  "QUOTE_WAITING",
] as const;
export const MyWorkTaskKindSchema = z.enum(MY_WORK_TASK_KINDS);
export type MyWorkTaskKind = z.infer<typeof MyWorkTaskKindSchema>;

/** The groups of Needs you, in the order they show. */
export const MY_WORK_TASK_GROUPS = ["BLOCKED", "LATE", "TODAY", "SOON", "WAITING"] as const;
export const MyWorkTaskGroupSchema = z.enum(MY_WORK_TASK_GROUPS);
export type MyWorkTaskGroup = z.infer<typeof MyWorkTaskGroupSchema>;

/** Hours before the order's first line start a run sheet is due to be sent. */
export const RUN_SHEET_LEAD_HOURS = 24;
/** Hours before the order's first line start its soft holds are due to be confirmed or released. */
export const CONFIRM_LEAD_HOURS = 48;

export const MyWorkTasksInputSchema = z.object({
  kinds: z.array(MyWorkTaskKindSchema).optional().describe("Only these kinds; absent = every kind"),
});
export type MyWorkTasksInput = z.infer<typeof MyWorkTasksInputSchema>;

const only = ({ kinds }: { kinds: string }) => `${kinds} only; null otherwise`;

/**
 * One thing the member must act on. HARD_CLASH: another order's hard hold or a block overlaps a
 * line of this order. RUN_SHEET_BLOCKED / RUN_SHEET_UNSENT: the current run sheet is blocked, or
 * not sent or changed since it was sent. LINE_ISSUE: a line has a planning issue (`issueKind`).
 * UNCONFIRMED: soft holds close to the start. HOLD_EXPIRES: holdsUntil within 7 days.
 * UNREAD_MESSAGES: unread customer messages (`count`). PAYMENT_OVERDUE: an invoice with money
 * open past its due date. NOT_CLOSED: every line has ended and the status does not close.
 * QUOTE_WAITING: a sent quote waits on the customer.
 */
export const MyWorkTaskSchema = z.object({
  key: z.string().describe("Stable within a read: `<kind>:<orderId>[:<id>]`"),
  kind: MyWorkTaskKindSchema,
  group: MyWorkTaskGroupSchema.describe(
    "BLOCKED, LATE (due before now), TODAY, SOON (through the end of next week) or WAITING",
  ),
  dueAt: z.date().describe("When it is due; the list is sorted by it inside a group"),
  orderId: z.string().describe("order.get"),
  reference: z.number().int(),
  title: z.string().nullable().describe("The order's title; null until it has one"),
  customerName: z.string().nullable().describe("Null without customer:read"),
  runSheetId: z
    .string()
    .nullable()
    .describe(`runSheet.get; ${only({ kinds: "RUN_SHEET_*" })}`),
  runSheetName: z
    .string()
    .nullable()
    .describe(only({ kinds: "RUN_SHEET_*" })),
  lineId: z
    .string()
    .nullable()
    .describe(`line.get; ${only({ kinds: "HARD_CLASH and LINE_ISSUE" })}`),
  lineName: z
    .string()
    .nullable()
    .describe(only({ kinds: "HARD_CLASH and LINE_ISSUE" })),
  issueKind: LineIssueKindSchema.nullable().describe(only({ kinds: "LINE_ISSUE" })),
  otherReference: z
    .number()
    .int()
    .nullable()
    .describe(`${only({ kinds: "HARD_CLASH" })}: the holding order; null for a block`),
  quoteId: z
    .string()
    .nullable()
    .describe(`quote.get; ${only({ kinds: "QUOTE_WAITING" })}`),
  invoiceId: z
    .string()
    .nullable()
    .describe(`invoice.get; ${only({ kinds: "PAYMENT_OVERDUE" })}`),
  amountMinor: z
    .number()
    .int()
    .nullable()
    .describe(`${only({ kinds: "PAYMENT_OVERDUE" })}: open, minor units incl. VAT`),
  count: z
    .number()
    .int()
    .nullable()
    .describe(only({ kinds: "UNREAD_MESSAGES and UNCONFIRMED" })),
});
export type MyWorkTask = z.infer<typeof MyWorkTaskSchema>;

export const MyWorkTasksSchema = z.object({
  now: z.date().describe("The instant the tasks were derived at"),
  timeZone: z.string(),
  tasks: z
    .array(MyWorkTaskSchema)
    .nullable()
    .describe("By group, then due, then reference; null without order:read"),
});
export type MyWorkTasks = z.infer<typeof MyWorkTasksSchema>;
