import { z } from "zod";
import { PlanLineIssueSchema } from "../ticket/plan/issue-schema";

export const LineIssuesInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket (ticket.list) whose lines to check"),
});

export const LineIssueSchema = PlanLineIssueSchema.extend({
  otherLineId: z
    .string()
    .nullable()
    .describe("Set for SELF_OVERLAP: the other line of the same ticket (line.get); null otherwise"),
});

export const LineWithIssuesSchema = z.object({
  lineId: z.string().describe("The line (line.get)"),
  name: z.string().describe("The line's name"),
  issues: z.array(LineIssueSchema).min(1),
});

export const LineIssuesOutputSchema = z.object({
  availabilityHidden: z
    .boolean()
    .describe(
      "True without item:read: clashes, overlaps, setup capacity, pools and hours are left out",
    ),
  lines: z
    .array(LineWithIssuesSchema)
    .describe("The ticket's active lines that have issues, in time order; empty when none has"),
});

export type LineIssuesInput = z.infer<typeof LineIssuesInputSchema>;
export type LineIssue = z.infer<typeof LineIssueSchema>;
export type LineIssues = z.infer<typeof LineIssuesOutputSchema>;
