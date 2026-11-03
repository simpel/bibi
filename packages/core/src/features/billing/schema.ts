import { z } from "zod";
import { FixedRoleSchema } from "../../permissions/fixed-roles";

export const BillingIntervalSchema = z.enum(["MONTH", "YEAR"]);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

/**
 * Whether the organization may use the app (ADR 0095). `UNCONFIGURED`: Bibi's billing is not set
 * up, so nothing is gated. `REQUIRED`: the trial is over and no subscription pays for it.
 */
export const BillingAccessStateSchema = z.enum([
  "EXEMPT",
  "UNCONFIGURED",
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "REQUIRED",
]);
export type BillingAccessState = z.infer<typeof BillingAccessStateSchema>;

export const BillingAccessSchema = z.object({
  state: BillingAccessStateSchema,
  /** False only for `REQUIRED`: every page then leads to the payment page. */
  open: z.boolean(),
  trialEndsAt: z.date(),
  /** The caller has `billing:write` and can pay. */
  canPay: z.boolean(),
});
export type BillingAccessDto = z.infer<typeof BillingAccessSchema>;

export const BillingSeatsSchema = z.object({
  included: z.number().int(),
  extra: z.number().int(),
  /** Members plus pending invitations. */
  used: z.number().int(),
  /** Invitations waiting for an admin to approve a seat. */
  held: z.number().int(),
});

export const BillingSchema = z.object({
  id: z.string().nullable().describe("null until the first change"),
  organizationId: z.string(),
  access: BillingAccessSchema,
  seats: BillingSeatsSchema,
  autoAssignSeats: z.boolean(),
  interval: BillingIntervalSchema.nullable(),
  subscriptionStatus: z.string().nullable().describe("Stripe's subscription status"),
  currentPeriodEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  hasCustomer: z.boolean().describe("A Stripe customer exists, so the portal can open"),
  prices: z.object({
    currency: z.string(),
    baseMonthlyMinor: z.number().int(),
    baseYearlyMinor: z.number().int(),
    seatMonthlyMinor: z.number().int(),
  }),
});
export type BillingDto = z.infer<typeof BillingSchema>;

export const BillingGetInputSchema = z.object({});

export const BillingUpdateInputSchema = z.object({
  autoAssignSeats: z
    .boolean()
    .optional()
    .describe("On: an invitation beyond the seats adds a paid seat. Off: it waits for approval"),
  extraSeats: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .optional()
    .describe("Paid seats beyond the included 10; never below what members use"),
});
export type BillingUpdateInput = z.infer<typeof BillingUpdateInputSchema>;

/** A same-origin path to come back to, e.g. `/tickets/abc` (never a full URL). */
export const ReturnPathSchema = z
  .string()
  .max(2000)
  .regex(/^\/(?!\/)[^\s\\]*$/, "A path starting with one /")
  .default("/");

export const BillingCheckoutInputSchema = z.object({
  interval: BillingIntervalSchema.describe("MONTH, or YEAR with 10 % off the base price"),
  returnTo: ReturnPathSchema.describe("Path in the organization to open after paying"),
});
export type BillingCheckoutInput = z.infer<typeof BillingCheckoutInputSchema>;

export const BillingPortalInputSchema = z.object({ returnTo: ReturnPathSchema });
export type BillingPortalInput = z.infer<typeof BillingPortalInputSchema>;

export const BillingRedirectSchema = z.object({
  url: z.string().nullable().describe("Stripe page to open in a browser; null until created"),
});
export type BillingRedirectDto = z.infer<typeof BillingRedirectSchema>;

export const SeatRequestSchema = z.object({
  id: z.string().describe("The held invitation's id"),
  organizationId: z.string(),
  email: z.string(),
  role: FixedRoleSchema.nullable(),
  inviterId: z.string(),
  createdAt: z.date(),
});
export type SeatRequestDto = z.infer<typeof SeatRequestSchema>;

export const SeatRequestListSchema = z.object({ items: z.array(SeatRequestSchema) });
export const SeatRequestIdInputSchema = z.object({
  id: z.string().min(1).describe("Held invitation id (from billing.listSeatRequests)"),
});

export const BillingReminderSchema = z.object({
  organizationId: z.string(),
  /** False when the admins were already reminded within the last hour. */
  sent: z.boolean(),
  remindedAt: z.date().nullable(),
});
export type BillingReminderDto = z.infer<typeof BillingReminderSchema>;
