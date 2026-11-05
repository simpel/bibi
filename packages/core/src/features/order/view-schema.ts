import { z } from "zod";
import { OrderBalanceSchema } from "../payment/balance-schema";
import { OrderSchema } from "./schema";

/** A colleague by name (ADR 0072): colleagues' names are shared vocabulary in the organization. */
export const OrderViewPersonSchema = z.object({
  userId: z.string(),
  name: z.string(),
});

const ViewStatusSchema = z.object({
  id: z.string(),
  name: z.string().describe("Status name as staff see it, e.g. Lead or Confirmed"),
  color: z.string().describe("Hex color"),
});

const ViewCustomerSchema = z.object({ id: z.string(), name: z.string() });

const ViewContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

const ViewProgramSchema = z.object({
  lineCount: z.number().int().describe("Active lines on the order, sub-lines included"),
  totalExclVatMinor: z.number().int().describe("The priced lines' total excl. VAT (ADR 0052)"),
  totalInclVatMinor: z.number().int(),
  totalIsFrom: z
    .boolean()
    .describe("True while an alternative group is not chosen: the total is a 'from' price"),
  issueCount: z
    .number()
    .int()
    .describe("Open issues on the lines now (line.issues): clashes, overlaps, shortfalls, hours"),
});

const ViewBalanceSchema = OrderBalanceSchema.pick({
  billedFrom: true,
  billedMinor: true,
  paidMinor: true,
  balanceMinor: true,
});

/**
 * One order as its page shows it (ADR 0071, 0097): the order's own fields plus other features'
 * data, each joined field null (or empty) without that feature's `read`.
 */
export const OrderViewSchema = OrderSchema.extend({
  /** The order's guaranteed headcount, else its estimate (the order's own). */
  guestCount: z.number().int().nullable(),
  currency: z.string(),
  currentStatus: ViewStatusSchema.nullable().describe(
    "The order's status; null without pipeline:read",
  ),
  customer: ViewCustomerSchema.nullable().describe("null without customer:read"),
  contact: ViewContactSchema.nullable().describe("null without customer:read or without contact"),
  assignee: OrderViewPersonSchema.nullable().describe("The main assignee; null when nobody"),
  followers: z.array(OrderViewPersonSchema).describe("Who follows the order (main assignment)"),
  program: ViewProgramSchema.nullable().describe(
    "Lines, totals and issues; null without program:read",
  ),
  balance: ViewBalanceSchema.nullable().describe(
    "What is billed, paid and open; null without payment:read",
  ),
});

export type OrderViewDto = z.infer<typeof OrderViewSchema>;
export type OrderViewPerson = z.infer<typeof OrderViewPersonSchema>;
