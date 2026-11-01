import { z } from "zod";

const minor = ({ what }: { what: string }) => z.number().int().describe(`${what}, minor units`);
const customerName = z
  .string()
  .nullable()
  .describe("The customer's name; null without customer:read");

export const ExpiringHoldSchema = z.object({
  ticketId: z.string().describe("ticket.get"),
  reference: z.number().int(),
  customerName,
  holdsUntil: z.date().describe("When the expiring lines fall to their expiry state"),
  lines: z.number().int().describe("Active lines still in an expiring state"),
});

export const UnsentSheetSchema = z.object({
  sheetId: z.string().describe("sheet.get"),
  ticketId: z.string().describe("ticket.get"),
  reference: z.number().int(),
  name: z.string().describe("The sheet definition's name"),
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
  unsentSheets: z
    .array(UnsentSheetSchema)
    .nullable()
    .describe(
      "Newest sheet versions not sent, for tickets starting within the horizon; needs sheet:read",
    ),
  overdue: OverdueSchema.nullable().describe("Needs finance:read and payment:read"),
});

export const ComingUpSchema = z.object({
  ticketId: z.string().describe("ticket.get"),
  reference: z.number().int(),
  customerName,
  statusName: z.string().describe("The ticket's status"),
  startsAt: z.date().describe("The first line start inside the horizon"),
  lines: z.number().int().describe("Lines starting inside the horizon"),
});

export type Attention = z.infer<typeof AttentionSchema>;
export type ExpiringHold = z.infer<typeof ExpiringHoldSchema>;
export type UnsentSheet = z.infer<typeof UnsentSheetSchema>;
export type ComingUp = z.infer<typeof ComingUpSchema>;
