import { z } from "zod";
import { TicketTitleInputSchema } from "./title/title-schema";

export const TicketCreateFromTemplateInputSchema = z.object({
  title: TicketTitleInputSchema,
  templateId: z.string().min(1).describe("Id of the predefined ticket (ticketTemplate.list)"),
  customerId: z.string().min(1).describe("Id of the customer who asks (customer.list)"),
  contactId: z
    .string()
    .min(1)
    .describe("Id of the contact person at the customer (contact.list); required (ADR 0081)"),
  startsAt: z.coerce
    .date()
    .describe("When the ticket starts, ISO 8601; each line is timed from here"),
  headcount: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .describe("The estimated headcount; template lines without a quantity count it"),
  assigneeId: z
    .string()
    .min(1)
    .nullish()
    .describe(
      "User id of the main assignee (member.list userId); required when the template's status " +
        "requires an assignee",
    ),
});

export type TicketCreateFromTemplateInput = z.infer<typeof TicketCreateFromTemplateInputSchema>;
