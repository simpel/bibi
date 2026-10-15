import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { BOOKING_STATUS_TEMPLATE_KEYS } from "../../templates/booking-statuses/booking-status-templates";

/**
 * The fixed phases of a booking (ADR 0022), in lifecycle order. Each controls system behaviour
 * (occupancy, sheets, invoicing, cancellation); an organization's statuses are labels inside them.
 */
export const BOOKING_PHASES = ["TENTATIVE", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type BookingPhase = (typeof BOOKING_PHASES)[number];

export const BookingPhaseSchema = z
  .enum(BOOKING_PHASES)
  .describe(
    "Fixed phase: TENTATIVE (items occupied, no sheets), CONFIRMED (coordinator required), " +
      "COMPLETED (after the booking ended, invoiceable), CANCELLED (reason required)",
  );

export const BookingStatusSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  color: z.string(),
  phase: BookingPhaseSchema,
  /** Order among the organization's statuses; the first status of a phase is its default. */
  position: z.number().int(),
  /** Ids of the statuses a booking may move to from this one (ADR 0022). */
  transitionsTo: z.array(z.string()),
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
  .describe("Status name as staff see it, e.g. Tentative or Final count locked");

const ColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color such as #22c55e")
  .describe("Hex color, e.g. #22c55e");

export const BookingStatusCreateInputSchema = z.object({
  name: NameSchema,
  color: ColorSchema,
  phase: BookingPhaseSchema.describe("Fixed once created: archive and recreate to change it"),
});

export const BookingStatusUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  color: ColorSchema.optional(),
});

export const BookingStatusIdInputSchema = z.object({ id: z.string().min(1) });

export const BookingStatusListInputSchema = z.object(PageInputShape);

export const BookingStatusListOutputSchema = z.object({
  items: z.array(BookingStatusSchema),
  nextCursor: z.string().nullable(),
});

export const BookingStatusReorderInputSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).describe("Every active status id, in the new order"),
});

export const BookingStatusSetTransitionsInputSchema = z.object({
  id: z.string().min(1).describe("The status the transitions start from"),
  toStatusIds: z
    .array(z.string().min(1))
    .describe("Every status a booking may move to from this one; replaces the current set"),
});

export const BookingStatusImportTemplateInputSchema = z.object({
  template: z
    .enum(BOOKING_STATUS_TEMPLATE_KEYS)
    .describe(
      "default: one status per phase. conference-venue: Tentative, Confirmed, Final count " +
        "locked, Completed, Cancelled; every transition forward and to Cancelled",
    ),
});

export const BookingStatusImportTemplateOutputSchema = z.object({
  /** Statuses created by this import. */
  created: z.array(BookingStatusSchema),
  /** Names that already existed and were left untouched. */
  skipped: z.array(z.string()),
  /** Transitions added between the template's statuses (existing ones are kept). */
  transitionsAdded: z.number().int(),
});

export type BookingStatusDto = z.infer<typeof BookingStatusSchema>;
export type BookingStatusCreateInput = z.infer<typeof BookingStatusCreateInputSchema>;
export type BookingStatusUpdateInput = z.infer<typeof BookingStatusUpdateInputSchema>;
export type BookingStatusImportResult = z.infer<typeof BookingStatusImportTemplateOutputSchema>;
