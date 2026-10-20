import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { LineSchema } from "../line/schema";

export const TicketSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  /** Reference number, sequential per organization. */
  reference: z.number().int(),
  entityTypeId: z.string(),
  customerId: z.string(),
  contactId: z.string().nullable(),
  /** The organization's own phase (ADR 0043); the newest entry of its phase history (ADR 0054). */
  phaseId: z.string(),
  desiredStartsAt: z.date().nullable(),
  desiredEndsAt: z.date().nullable(),
  estimatedHeadcount: z.number().int().nullable(),
  guaranteedHeadcount: z.number().int().nullable(),
  budgetMinor: z.number().int().nullable(),
  /** Lines in an expiring state fall to their type's expiry state after this date (ADR 0044). */
  holdsUntil: z.date().nullable(),
  /** When the ticket entered its phase (time in phase): its newest `TicketPhaseChange`. */
  phaseChangedAt: z.date(),
  /** The reason given with the last phase change (newest `TicketPhaseChange`). */
  phaseReason: z.string().nullable(),
  fields: FieldValuesSchema,
  /**
   * Derived, not stored (ADR 0012, 0043): `ticket-<id>@<MAIL_INBOUND_DOMAIN>`, the reply-to of
   * ticket mail. Null when inbound mail is not configured.
   */
  inboundAddress: z
    .email()
    .nullable()
    .describe(
      "Address the customer replies to so the mail lands on this ticket; null when inbound mail is not configured",
    ),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const CountSchema = z.number().int().min(0).max(100_000);

const TicketDetailsShape = {
  customerId: z.string().min(1).describe("Id of the customer who asks (customer.list)"),
  contactId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of a contact person at the customer (contact.list)"),
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
  holdsUntil: z.coerce
    .date()
    .nullish()
    .describe(
      "We hold the ticket's soft holds until this date, ISO 8601. Lines in an expiring state " +
        "fall to their type's expiry state after it (ticket.expireHolds); null: nothing expires",
    ),
};

export const TicketCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the ticket type (entityType.list base TICKET)"),
  ...TicketDetailsShape,
  assigneeId: z
    .string()
    .min(1)
    .nullish()
    .describe("User id of the main assignee; must be a member (member.list userId)"),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

/** Phase and assignee are not here: they change only through their own commands. */
export const TicketUpdateInputSchema = z
  .object(TicketDetailsShape)
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const TicketChangePhaseInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket"),
  phaseId: z
    .string()
    .min(1)
    .describe("Id of the new phase; must be an allowed move (ticketPhase.list transitionsTo)"),
  reason: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .describe("Why the phase changes; required when the new phase requires a reason"),
});

export const TicketExpireHoldsInputSchema = z.object({});

export const TicketExpireHoldsOutputSchema = z.object({
  /** The lines that moved to their type's expiry state. */
  items: z.array(LineSchema),
});

export const TicketIdInputSchema = z.object({ id: z.string().min(1) });

export const TicketListInputSchema = z.object({
  customerId: z.string().optional().describe("Only tickets of this customer"),
  entityTypeId: z.string().optional().describe("Only tickets of this type"),
  phaseId: z.string().optional().describe("Only tickets in this phase"),
  assigneeId: z.string().optional().describe("Only tickets this user is assigned to"),
  followerId: z.string().optional().describe("Only tickets this user follows"),
  from: z.coerce.date().optional().describe("Only tickets whose desired period ends after this"),
  to: z.coerce.date().optional().describe("Only tickets whose desired period starts before this"),
  ...PageInputShape,
});

export const TicketListOutputSchema = z.object({
  items: z.array(TicketSchema),
  nextCursor: z.string().nullable(),
});

export type TicketDto = z.infer<typeof TicketSchema>;
export type TicketCreateInput = z.infer<typeof TicketCreateInputSchema>;
export type TicketUpdateInput = z.infer<typeof TicketUpdateInputSchema>;
export type TicketChangePhaseInput = z.infer<typeof TicketChangePhaseInputSchema>;
