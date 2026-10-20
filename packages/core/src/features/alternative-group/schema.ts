import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

/**
 * Lines on one ticket of which the customer picks exactly one (ADR 0052), e.g. "Room A or Room
 * B". The options are the active lines with this `alternativeGroupId`.
 */
export const AlternativeGroupSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ticketId: z.string(),
  name: z.string(),
  chosenLineId: z
    .string()
    .nullable()
    .describe("The option the customer picked (line.get); null until chosen"),
  optionLineIds: z
    .array(z.string())
    .describe("The active lines (line.get) that are options of the group, in time order"),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NameSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .describe("What the customer picks between, e.g. Conference room");

const LineIdsSchema = z
  .array(z.string().min(1))
  .min(2)
  .max(20)
  .describe(
    "Ids of two or more active lines of the ticket (line.list) that are the options; none may " +
      "be an option of another group, and at most one may be in a hard-hold state",
  );

export const AlternativeGroupCreateInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket (ticket.list)"),
  name: NameSchema,
  lineIds: LineIdsSchema,
});

export const AlternativeGroupUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  lineIds: LineIdsSchema.optional().describe(
    "The new set of options (replaces the old one; left-out lines become ordinary lines). " +
      "Only before an option is chosen",
  ),
});

export const AlternativeGroupChooseInputSchema = z.object({
  id: z.string().min(1).describe("Id of the alternative group (alternativeGroup.list)"),
  lineId: z.string().min(1).describe("Id of the option the customer picked (one of optionLineIds)"),
});

export const AlternativeGroupIdInputSchema = z.object({ id: z.string().min(1) });

export const AlternativeGroupListInputSchema = z.object({
  ticketId: z.string().optional().describe("Only the groups of this ticket"),
  ...PageInputShape,
});

export const AlternativeGroupListOutputSchema = z.object({
  items: z.array(AlternativeGroupSchema),
  nextCursor: z.string().nullable(),
});

export type AlternativeGroupDto = z.infer<typeof AlternativeGroupSchema>;
export type AlternativeGroupCreateInput = z.infer<typeof AlternativeGroupCreateInputSchema>;
export type AlternativeGroupUpdateInput = z.infer<typeof AlternativeGroupUpdateInputSchema>;
export type AlternativeGroupChooseInput = z.infer<typeof AlternativeGroupChooseInputSchema>;
