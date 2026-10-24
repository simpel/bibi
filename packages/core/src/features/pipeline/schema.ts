import { z } from "zod";

export const PipelineColumnSchema = z.object({
  id: z.string().describe("The ticket status id"),
  title: z.string().describe("The status name"),
  color: z.string().describe("The status colour"),
  requiresReason: z.boolean().describe("Entering the status needs a reason"),
  closed: z.boolean().describe("A closing status; shown in the collapsed Closed lane"),
});

export const PipelineCardSchema = z.object({
  id: z.string().describe("Ticket id"),
  columnId: z.string().describe("The ticket's status id"),
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
  assigneeId: z.string().optional().describe("Only tickets this user is assigned to"),
  entityTypeId: z.string().optional().describe("Only tickets of this type"),
  closedWithinDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30)
    .describe("Show tickets in closing statuses that moved there within this many days"),
});

export const PipelineBoardSchema = z.object({
  columns: z.array(PipelineColumnSchema),
  cards: z.array(PipelineCardSchema),
});

export type PipelineColumn = z.infer<typeof PipelineColumnSchema>;
export type PipelineCard = z.infer<typeof PipelineCardSchema>;
export type PipelineBoard = z.infer<typeof PipelineBoardSchema>;
export type PipelineBoardInput = z.infer<typeof PipelineBoardInputSchema>;
