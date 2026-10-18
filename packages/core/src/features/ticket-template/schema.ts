import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

export const QUANTITY_BASES = ["FIXED", "PER_HEADCOUNT"] as const;
export const QuantityBasisSchema = z
  .enum(QUANTITY_BASES)
  .describe("FIXED: the quantity as given. PER_HEADCOUNT: the quantity times the headcount");

export const TicketTemplateLineSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  entityTypeId: z.string(),
  name: z.string(),
  itemId: z.string().nullable(),
  setupId: z.string().nullable(),
  offsetMinutes: z.number().int(),
  durationMinutes: z.number().int(),
  quantity: z.number().int().nullable(),
  quantityBasis: QuantityBasisSchema,
});

export const TicketTemplateSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  entityTypeId: z.string(),
  /** The phase tickets made from the template start in. */
  phaseId: z.string(),
  fields: FieldValuesSchema,
  lines: z.array(TicketTemplateLineSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const MinutesSchema = z.number().int().min(0).max(525_600);

export const TicketTemplateLineInputSchema = z.object({
  entityTypeId: z
    .string()
    .min(1)
    .describe("Id of the program item type of the line (entityType.list base PROGRAM_ITEM)"),
  name: z.string().trim().min(1).max(200).describe("What the line is, e.g. Coffee and a bun"),
  itemId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of a general item (item.list), e.g. a room or a dish; not a customer's package"),
  setupId: z.string().min(1).nullish().describe("One of the item's setups (needs itemId)"),
  offsetMinutes: MinutesSchema.describe("Minutes from the ticket's start to the line's start"),
  durationMinutes: MinutesSchema.min(1).describe("How long the line lasts, in minutes"),
  quantity: z.number().int().min(0).max(100_000).nullish().describe("The line's quantity"),
  quantityBasis: QuantityBasisSchema.optional(),
});

const DetailsShape = {
  name: z.string().trim().min(1).max(100).describe("Template name, e.g. Small meeting"),
  entityTypeId: z.string().min(1).describe("Id of the ticket type (entityType.list base TICKET)"),
  phaseId: z
    .string()
    .min(1)
    .describe("Id of the phase tickets start in (ticketPhase.list); not a terminal phase"),
  fields: FieldValuesSchema.optional().describe(
    "Default values of the ticket type's own fields, by field key",
  ),
  lines: z.array(TicketTemplateLineInputSchema).max(100).describe("The lines, in order"),
};

export const TicketTemplateCreateInputSchema = z.object(DetailsShape);

/** Omitted properties are unchanged; `lines` replaces the whole set when given. */
export const TicketTemplateUpdateInputSchema = z
  .object(DetailsShape)
  .partial()
  .extend({ id: z.string().min(1) });

export const TicketTemplateIdInputSchema = z.object({ id: z.string().min(1) });

export const TicketTemplateListInputSchema = z.object(PageInputShape);

export const TicketTemplateListOutputSchema = z.object({
  items: z.array(TicketTemplateSchema),
  nextCursor: z.string().nullable(),
});

export type TicketTemplateDto = z.infer<typeof TicketTemplateSchema>;
export type TicketTemplateLineDto = z.infer<typeof TicketTemplateLineSchema>;
export type TicketTemplateLineInput = z.infer<typeof TicketTemplateLineInputSchema>;
export type TicketTemplateCreateInput = z.infer<typeof TicketTemplateCreateInputSchema>;
export type TicketTemplateUpdateInput = z.infer<typeof TicketTemplateUpdateInputSchema>;
