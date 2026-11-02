import { z } from "zod";

const minor = ({ what }: { what: string }) => z.number().int().describe(`${what}, minor units`);
const ticketTitle = z.string().nullable().describe("The ticket's title; null until it has one");
const customerName = z
  .string()
  .nullable()
  .describe("The customer's name; null without customer:read");

export const ExpiringHoldSchema = z.object({
  ticketId: z.string().describe("ticket.get"),
  reference: z.number().int(),
  title: ticketTitle,
  customerName,
  holdsUntil: z.date().describe("When the expiring lines fall to their expiry state"),
  lines: z.number().int().describe("Active lines still in an expiring state"),
});

export const UnsentWorkOrderSchema = z.object({
  workOrderId: z.string().describe("workOrder.get"),
  ticketId: z.string().describe("ticket.get"),
  reference: z.number().int(),
  title: ticketTitle,
  name: z.string().describe("The work order definition's name"),
  version: z.number().int(),
  startsAt: z.date().describe("The ticket's first line start inside the horizon"),
});

export const OverdueSchema = z.object({
  invoices: z.number().int().describe("Sent invoices with money open past their due date"),
  totalMinor: minor({ what: "Open on them, including VAT" }),
});

/** What staff should act on (ADR 0080); each list is a part with its own `read` gate. */
export const AttentionSchema = z.object({
  expiringHolds: z
    .array(ExpiringHoldSchema)
    .describe("Tickets whose holdsUntil falls within the next 7 days, soonest first"),
  unsentWorkOrders: z
    .array(UnsentWorkOrderSchema)
    .nullable()
    .describe(
      "Newest work order versions not sent, for tickets starting within the horizon; needs workOrder:read",
    ),
  overdue: OverdueSchema.nullable().describe("Needs finance:read and payment:read"),
});

export const ScheduledSchema = z.object({
  ticketId: z.string().describe("ticket.get"),
  reference: z.number().int(),
  title: ticketTitle,
  customerName,
  statusName: z.string().describe("The ticket's status"),
  startsAt: z.date().describe("The first line start inside the range"),
  lines: z.number().int().describe("Lines starting inside the range"),
});

export type Attention = z.infer<typeof AttentionSchema>;
export type ExpiringHold = z.infer<typeof ExpiringHoldSchema>;
export type UnsentWorkOrder = z.infer<typeof UnsentWorkOrderSchema>;
export type Scheduled = z.infer<typeof ScheduledSchema>;
