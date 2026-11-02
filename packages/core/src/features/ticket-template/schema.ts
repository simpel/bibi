import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

export const TicketTemplateLineSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  entityTypeId: z.string(),
  name: z.string(),
  itemId: z.string().nullable(),
  setupId: z.string().nullable(),
  offsetMinutes: z.number().int(),
  durationMinutes: z.number().int(),
  /** Null = the line counts the ticket's headcount (ADR 0052). */
  quantity: z.number().int().nullable(),
  options: z
    .array(
      z.object({
        itemId: z.string().describe("The preselected option's item"),
        stale: z
          .boolean()
          .describe(
            "Derived: the default no longer fits the line's item (not one of its options, in a " +
              "split group, or over its group's maxPick) and is ignored when the package is used",
          ),
      }),
    )
    .describe("Choices the package preselects for the line (ADR 0089), in order"),
});

export const TicketTemplateSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  entityTypeId: z.string(),
  /** The status tickets made from the template start in. */
  statusId: z.string(),
  fields: FieldValuesSchema,
  /** The guest range the package is made for (ADR 0081); null = no limit on that side. */
  minGuests: z.number().int().nullable(),
  maxGuests: z.number().int().nullable(),
  lines: z.array(TicketTemplateLineSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const MinutesSchema = z.number().int().min(0).max(525_600);

const GuestsSchema = z.number().int().min(1).max(100_000);

export const TicketTemplateLineInputSchema = z.object({
  entityTypeId: z
    .string()
    .min(1)
    .describe("Id of the line type of the line (entityType.list base LINE)"),
  name: z.string().trim().min(1).max(200).describe("What the line is, e.g. Coffee and a bun"),
  itemId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of a general item (item.list), e.g. a room or a dish; not a customer's bundle"),
  setupId: z.string().min(1).nullish().describe("One of the item's setups (needs itemId)"),
  offsetMinutes: MinutesSchema.describe("Minutes from the ticket's start to the line's start"),
  durationMinutes: MinutesSchema.min(1).describe("How long the line lasts, in minutes"),
  quantity: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .nullish()
    .describe("The line's quantity; null = the ticket's headcount"),
  options: z
    .array(z.object({ itemId: z.string().min(1).describe("An option item (item.get groups)") }))
    .max(50)
    .optional()
    .describe(
      "Choices to preselect for the line (ADR 0089): options of the item's customisation " +
        "groups, at most a group's maxPick, none in a split group. Replaces the line's defaults",
    ),
});

const DetailsShape = {
  name: z.string().trim().min(1).max(100).describe("Template name, e.g. Small meeting"),
  entityTypeId: z.string().min(1).describe("Id of the ticket type (entityType.list base TICKET)"),
  statusId: z
    .string()
    .min(1)
    .describe("Id of the status tickets start in (ticketStatus.list); not a closing status"),
  fields: FieldValuesSchema.optional().describe(
    "Default values of the ticket type's own fields, by field key",
  ),
  minGuests: GuestsSchema.nullish().describe(
    "Fewest guests the package is made for; null = no lower limit (at most maxGuests)",
  ),
  maxGuests: GuestsSchema.nullish().describe(
    "Most guests the package is made for; null = no upper limit",
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
