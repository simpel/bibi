import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { ORDER_STATUS_TEMPLATE_KEYS } from "../../templates/order-statuses/order-status-templates";
import { StatusGatesSchema, TransitionGatesSchema } from "./gate-schema";

/** The generic status flags (ADR 0043); move rules are gates on transitions (ADR 0067). */
export const STATUS_FLAGS = ["entry", "closes", "invoiceable"] as const;
export type StatusFlag = (typeof STATUS_FLAGS)[number];

/** The quote events that can move an order into a status (ADR 0043). */
export const STATUS_EVENTS = ["QUOTE_SENT", "QUOTE_ACCEPTED"] as const;
export const StatusEventSchema = z.enum(STATUS_EVENTS);
export type StatusEvent = z.infer<typeof StatusEventSchema>;

const EventSchema = StatusEventSchema.nullable().describe(
  "Quote event that moves orders into this status (QUOTE_SENT or QUOTE_ACCEPTED); null for none. " +
    "At most one status per event; a status with an event is not entered by hand",
);

const FlagShape = {
  entry: z
    .boolean()
    .describe("New orders start here; the first active entry status is the default"),
  closes: z.boolean().describe("No move leaves this status; entering it releases every line"),
  invoiceable: z.boolean().describe("Invoices can be created in this status"),
};

export const OrderStatusSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  color: z.string(),
  /** Order among the organization's statuses (left to right on the board). */
  position: z.number().int(),
  ...FlagShape,
  event: EventSchema,
  /** Free movement (false) or only to the listed statuses (true), ADR 0076. */
  restrictsNext: z.boolean(),
  /**
   * The statuses an order may move to from this one: every other status by hand while free, the
   * chosen ones when it restricts; none from a closing status.
   */
  transitionsTo: z.array(z.string()),
  /** The gates on those moves, from any status and from this one merged; targets without gates are not listed. */
  transitionGates: z.array(TransitionGatesSchema),
  /** The gates on moves into this status, by source (ADR 0076); what the flow editor edits. */
  gatesInto: z.array(StatusGatesSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .describe("Status name as staff see it, e.g. Lead, Quote sent or Lost");

export const ColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color such as #22c55e")
  .describe("Hex color, e.g. #22c55e");

const OptionalFlags = z.object({ ...FlagShape, event: EventSchema }).partial().shape;

/** A new status is a name and a colour; its flags are set with `orderStatus.update`. */
export const OrderStatusCreateInputSchema = z.object({
  name: NameSchema,
  color: ColorSchema,
  phaseId: z
    .string()
    .min(1)
    .optional()
    .describe("Board phase to show it in; omitted leaves it on no board until moved onto one"),
});

export const OrderStatusUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  color: ColorSchema.optional(),
  ...OptionalFlags,
});

export const OrderStatusIdInputSchema = z.object({ id: z.string().min(1) });

export const OrderStatusArchiveInputSchema = z.object({
  id: z.string().min(1),
  targetStatusId: z
    .string()
    .min(1)
    .optional()
    .describe("Where the status's orders move; required when the status holds orders"),
  reason: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .describe("Reason for the moved orders; required when the target status requires one"),
});

export const OrderStatusListInputSchema = z.object(PageInputShape);

export const OrderStatusListOutputSchema = z.object({
  items: z.array(OrderStatusSchema),
  nextCursor: z.string().nullable(),
});

export const OrderStatusReorderInputSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).describe("Every active status id, in the new order"),
});

export const OrderStatusImportTemplateInputSchema = z.object({
  template: z
    .enum(ORDER_STATUS_TEMPLATE_KEYS)
    .describe(
      "default: Lead, Confirmed, Completed, Lost. conference-estate: New, Site visit, Quote sent, " +
        "Confirmed, Final count locked, Completed, Lost, Cancelled. Both let orders move freely, " +
        "with the template's gates on moves into a status",
    ),
});

export const OrderStatusImportTemplateOutputSchema = z.object({
  /** Statuses created by this import. */
  created: z.array(OrderStatusSchema),
  /** Names that already existed and were left untouched. */
  skipped: z.array(z.string()),
  /** Gates added on moves into the template's statuses (existing ones are kept). */
  gatesAdded: z.number().int(),
});

export type OrderStatusDto = z.infer<typeof OrderStatusSchema>;
export type OrderStatusFlags = Pick<OrderStatusDto, StatusFlag>;
export type OrderStatusCreateInput = z.infer<typeof OrderStatusCreateInputSchema>;
export type OrderStatusUpdateInput = z.infer<typeof OrderStatusUpdateInputSchema>;
export type OrderStatusArchiveInput = z.infer<typeof OrderStatusArchiveInputSchema>;
export type OrderStatusImportResult = z.infer<typeof OrderStatusImportTemplateOutputSchema>;
