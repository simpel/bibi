import { z } from "zod";

export const PipelineColumnSchema = z.object({
  id: z.string().describe("The ticket phase id"),
  title: z.string().describe("The phase name"),
  color: z.string().describe("The phase colour"),
  requiresReason: z.boolean().describe("Entering the phase needs a reason"),
  closed: z.boolean().describe("A terminal phase; shown in the collapsed Closed lane"),
});

export const PipelineCardSchema = z.object({
  id: z.string().describe("Ticket id"),
  columnId: z.string().describe("The ticket's phase id"),
  reference: z.number().int().describe("Ticket reference number"),
  typeName: z.string(),
  customerName: z.string(),
  startsAt: z.date().nullable().describe("Desired start"),
  endsAt: z.date().nullable().describe("Desired end"),
  quantity: z
    .number()
    .int()
    .nullable()
    .describe("Guaranteed or estimated headcount, else the requested quantity"),
  phaseChangedAt: z.date().describe("When the ticket entered its phase (time in phase)"),
  assigneeId: z.string().nullable().describe("Main assignee (user id)"),
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
    .describe("Show tickets in terminal phases that moved there within this many days"),
});

export const PipelineBoardSchema = z.object({
  columns: z.array(PipelineColumnSchema),
  cards: z.array(PipelineCardSchema),
});

export type PipelineColumn = z.infer<typeof PipelineColumnSchema>;
export type PipelineCard = z.infer<typeof PipelineCardSchema>;
export type PipelineBoard = z.infer<typeof PipelineBoardSchema>;
export type PipelineBoardInput = z.infer<typeof PipelineBoardInputSchema>;
