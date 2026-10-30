import { z } from "zod";

export const PipelineStatusSchema = z.object({
  id: z.string().describe("The ticket status id"),
  title: z.string().describe("The status name"),
  color: z.string().describe("The status colour"),
  closed: z.boolean().describe("A closing status"),
});

export const PipelineColumnSchema = z.object({
  id: z.string().describe("The board phase id"),
  title: z.string().describe("The phase name"),
  closed: z.boolean().describe("Every status of the phase closes; shown as a closed lane"),
  statuses: z
    .array(PipelineStatusSchema)
    .describe("The ticket statuses in this column, in status order: one drop zone each"),
});

export const PipelineCardSchema = z.object({
  id: z.string().describe("Ticket id"),
  columnId: z.string().describe("The board phase (column) the ticket shows in"),
  statusId: z.string().describe("The ticket's status id"),
  reference: z.number().int().describe("Ticket reference number"),
  typeName: z.string(),
  customerId: z
    .string()
    .describe("The ticket's customer id; resolve its name with customer.get or customer.list"),
  startsAt: z.date().nullable().describe("Desired start"),
  endsAt: z.date().nullable().describe("Desired end"),
  quantity: z
    .number()
    .int()
    .nullable()
    .describe("Guaranteed or estimated headcount, else the requested quantity"),
  statusChangedAt: z.date().describe("When the ticket entered its status (time in status)"),
  assigneeId: z.string().nullable().describe("Main assignee (user id)"),
  heldLines: z
    .number()
    .int()
    .nullable()
    .describe("Lines in a soft-hold state (reserved, not blocking); null without program:read"),
  bookedLines: z
    .number()
    .int()
    .nullable()
    .describe("Lines in a hard-hold state (blocking their item); null without program:read"),
});

export const PipelineBoardInputSchema = z.object({
  boardId: z.string().optional().describe("The board to show (board.list); default: the first"),
  assigneeId: z
    .string()
    .optional()
    .describe("Only tickets this user is assigned to; replaces the board's own filter"),
  entityTypeId: z
    .string()
    .optional()
    .describe("Only tickets of this type; replaces the board's own filter"),
  closedWithinDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30)
    .describe("Show tickets in closing statuses that moved there within this many days"),
});

export const PipelineBoardSchema = z.object({
  boardId: z.string().nullable().describe("The board shown; null when the organization has none"),
  boardName: z.string().nullable(),
  columns: z.array(PipelineColumnSchema),
  cards: z.array(PipelineCardSchema),
  unmappedCount: z
    .number()
    .int()
    .describe("Matching tickets whose status is in no phase of this board, so not shown"),
});

export type PipelineStatus = z.infer<typeof PipelineStatusSchema>;
export type PipelineColumn = z.infer<typeof PipelineColumnSchema>;
export type PipelineCard = z.infer<typeof PipelineCardSchema>;
export type PipelineBoard = z.infer<typeof PipelineBoardSchema>;
export type PipelineBoardInput = z.infer<typeof PipelineBoardInputSchema>;
