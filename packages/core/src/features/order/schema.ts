import { z } from "zod";
import { RecordStatusSchema } from "../../shared/record-status";
import { BuyerReferenceSchema } from "../contact/schema";
import { BuyerKindSchema } from "../customer/schema";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { LineSchema } from "../line/schema";
import { OrderIntakeShape } from "./create-intake-schema";
import { EstimatedValueSchema } from "./estimate-history-schema";
import { OrderTitleInputSchema } from "./title/title-schema";

export const OrderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  /** Reference number, sequential per organization. */
  reference: z.number().int(),
  /** A short name staff know the order by; null until one is given or generated. */
  title: z.string().nullable(),
  entityTypeId: z.string(),
  customerId: z.string(),
  contactId: z.string().nullable(),
  buyerKind: BuyerKindSchema.nullable().describe(
    "Business or private set on this order; null = it follows the customer's",
  ),
  effectiveBuyerKind: BuyerKindSchema.describe(
    "Business or private for this order: its own, else the customer's (ADR 0106)",
  ),
  buyerReference: z
    .string()
    .nullable()
    .describe("The buyer's reference set on this order; null = it follows the contact's"),
  effectiveBuyerReference: z
    .string()
    .nullable()
    .describe("The reference invoices carry: the order's own, else its contact's (ADR 0105)"),
  buyerReferenceSource: z
    .enum(["ORDER", "CONTACT"])
    .nullable()
    .describe("Where effectiveBuyerReference comes from; null when there is none"),
  /** The organization's own status (ADR 0043); the newest entry of its status history (ADR 0054). */
  statusId: z.string(),
  /** The main assignee's user id (assignment.list, responsibility null); null: nobody (ADR 0055). */
  assigneeId: z.string().nullable(),
  desiredStartsAt: z.date().nullable(),
  desiredEndsAt: z.date().nullable(),
  estimatedHeadcount: z.number().int().nullable(),
  guaranteedHeadcount: z.number().int().nullable(),
  budgetMinor: z.number().int().nullable(),
  /** The newest entry of its estimate history (ADR 0074); null when never estimated or cleared. */
  estimatedValueMinor: z.number().int().nullable(),
  /** Lines in an expiring state fall to their type's expiry state after this date (ADR 0044). */
  holdsUntil: z.date().nullable(),
  /** When the order entered its status (time in status): its newest `OrderStatusChange`. */
  statusChangedAt: z.date(),
  /** The reason given with the last status change (newest `OrderStatusChange`). */
  statusReason: z.string().nullable(),
  fields: FieldValuesSchema,
  /** Booking-level notes for the whole order (ADR 0081); line notes stay on lines. */
  note: z.string().nullable(),
  /**
   * Derived, not stored (ADR 0012, 0043): `order-<id>@<MAIL_INBOUND_DOMAIN>`, the reply-to of
   * order mail. Null when inbound mail is not configured.
   */
  inboundAddress: z
    .email()
    .nullable()
    .describe(
      "Address the customer replies to so the mail lands on this order; null when inbound mail is not configured",
    ),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const CountSchema = z.number().int().min(0).max(100_000);

const OrderDetailsShape = {
  title: OrderTitleInputSchema,
  customerId: z.string().min(1).describe("Id of the customer who asks (customer.list)"),
  contactId: z
    .string()
    .min(1)
    .describe(
      "Id of the contact person at the customer (contact.list); required and never cleared (ADR 0081)",
    ),
  buyerKind: BuyerKindSchema.nullish().describe(
    "Business or private for this order only; null or omitted = follow the customer's",
  ),
  buyerReference: BuyerReferenceSchema.nullish().describe(
    "The buyer's reference for this order only, e.g. a case number; null or omitted = the contact's",
  ),
  desiredStartsAt: z.coerce.date().nullish().describe("Desired start, ISO 8601"),
  desiredEndsAt: z.coerce.date().nullish().describe("Desired end (after the start), ISO 8601"),
  estimatedHeadcount: CountSchema.nullish().describe(
    "Estimated number of guests; lines without a quantity count it unless guaranteed is set",
  ),
  guaranteedHeadcount: CountSchema.nullish().describe(
    "Guaranteed number of guests (locked some days before); wins over the estimate for lines",
  ),
  budgetMinor: z
    .number()
    .int()
    .min(0)
    .nullish()
    .describe("Budget in minor units (1/100 of the currency)"),
  estimatedValueMinor: EstimatedValueSchema.nullish(),
  holdsUntil: z.coerce
    .date()
    .nullish()
    .describe(
      "We hold the order's soft holds until this date, ISO 8601. Lines in an expiring state " +
        "fall to their type's expiry state after it (order.expireHolds); null: nothing expires",
    ),
  note: z
    .string()
    .trim()
    .max(4000)
    .nullish()
    .describe("Notes for the whole booking, shown on the order and its run sheets; null clears"),
};

export const OrderCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the order type (entityType.list base ORDER)"),
  ...OrderDetailsShape,
  assigneeId: z
    .string()
    .min(1)
    .nullish()
    .describe("User id of the main assignee; must be a member (member.list userId)"),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
  ...OrderIntakeShape,
});

/** Status and assignee are not here: they change only through their own commands. */
export const OrderUpdateInputSchema = z
  .object(OrderDetailsShape)
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const OrderChangeStatusInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order"),
  statusId: z
    .string()
    .min(1)
    .describe("Id of the new status; must be an allowed move (orderStatus.list transitionsTo)"),
  reason: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .describe("Why the status changes; required when the new status requires a reason"),
});

export const OrderExpireHoldsInputSchema = z.object({});

export const OrderExpireHoldsOutputSchema = z.object({
  /** The lines that moved to their type's expiry state. */
  items: z.array(LineSchema),
});

export const OrderIdInputSchema = z.object({ id: z.string().min(1) });

export type OrderDto = z.infer<typeof OrderSchema>;
export type OrderCreateInput = z.infer<typeof OrderCreateInputSchema>;
export type OrderUpdateInput = z.infer<typeof OrderUpdateInputSchema>;
export type OrderChangeStatusInput = z.infer<typeof OrderChangeStatusInputSchema>;
