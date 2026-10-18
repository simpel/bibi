import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

/** The option's fixed status (ADR 0022); the allowed moves are in `transitions.ts`. */
export const OPTION_STATUSES = ["ACTIVE", "CONVERTED", "EXPIRED", "RELEASED"] as const;
export const OptionStatusSchema = z.enum(OPTION_STATUSES);
export type OptionStatus = z.infer<typeof OptionStatusSchema>;

/** `Occupancy.sourceType` of the `OPTION` occupancy an option holds. */
export const OPTION_SOURCE = "option";

export const OptionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  itemId: z.string(),
  ticketId: z.string().nullable(),
  startsAt: z.date(),
  endsAt: z.date(),
  expiresAt: z.date(),
  /** Place in the queue (1 = first option); null once the option is no longer ACTIVE. */
  rank: z.number().int().nullable(),
  /** Changed only by the option's own commands (`option.release`, `option.expireDue`, …). */
  optionStatus: OptionStatusSchema,
  statusChangedAt: z.date(),
  note: z.string().nullable(),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const OptionCreateInputSchema = z.object({
  itemId: z.string().min(1).describe("Id of the bookable item (item.list behaviour BOOKABLE)"),
  startsAt: z.coerce.date().describe("Start of the held period, ISO 8601"),
  endsAt: z.coerce.date().describe("End of the held period (exclusive), ISO 8601"),
  expiresAt: z.coerce.date().describe("When the option expires unless converted, ISO 8601"),
  ticketId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of the ticket the option is placed for (ticket.list)"),
  note: z.string().trim().max(500).nullish().describe("Free note, e.g. what the hold is for"),
});

export const OptionIdInputSchema = z.object({ id: z.string().min(1) });

export const OptionListInputSchema = z.object({
  itemId: z.string().optional().describe("Only options on this item"),
  ticketId: z.string().optional().describe("Only options placed for this ticket"),
  optionStatus: OptionStatusSchema.optional().describe("ACTIVE, CONVERTED, EXPIRED or RELEASED"),
  from: z.coerce.date().optional().describe("Only periods that end after this time"),
  to: z.coerce.date().optional().describe("Only periods that start before this time"),
  ...PageInputShape,
});

export const OptionListOutputSchema = z.object({
  items: z.array(OptionSchema),
  nextCursor: z.string().nullable(),
});

export const OptionExpireDueInputSchema = z.object({});

export const OptionExpireDueOutputSchema = z.object({
  items: z.array(OptionSchema).describe("The options that expired now"),
});

export type OptionDto = z.infer<typeof OptionSchema>;
export type OptionCreateInput = z.infer<typeof OptionCreateInputSchema>;
