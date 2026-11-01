import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { TicketSchema } from "./schema";

export const TicketListInputSchema = z.object({
  customerId: z.string().optional().describe("Only tickets of this customer"),
  entityTypeId: z.string().optional().describe("Only tickets of this type"),
  statusId: z.string().optional().describe("Only tickets in this status"),
  assigneeId: z.string().optional().describe("Only tickets this user is assigned to"),
  followerId: z.string().optional().describe("Only tickets this user follows"),
  from: z.coerce.date().optional().describe("Only tickets whose desired period ends after this"),
  to: z.coerce.date().optional().describe("Only tickets whose desired period starts before this"),
  ...PageInputShape,
});

export const TicketListOutputSchema = z.object({
  items: z.array(TicketSchema),
  nextCursor: z.string().nullable(),
});
