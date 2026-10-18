import { z } from "zod";

export const TicketCreateFromTemplateInputSchema = z.object({
  templateId: z.string().min(1).describe("Id of the predefined ticket (ticketTemplate.list)"),
  customerId: z.string().min(1).describe("Id of the customer who asks (customer.list)"),
  startsAt: z.coerce
    .date()
    .describe("When the ticket starts, ISO 8601; each line is timed from here"),
  quantity: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .describe("The headcount: the ticket's quantity and what PER_HEADCOUNT lines multiply"),
  assigneeId: z
    .string()
    .min(1)
    .nullish()
    .describe(
      "User id of the main assignee (member.list userId); required when the template's phase " +
        "requires an assignee",
    ),
});

export type TicketCreateFromTemplateInput = z.infer<typeof TicketCreateFromTemplateInputSchema>;
