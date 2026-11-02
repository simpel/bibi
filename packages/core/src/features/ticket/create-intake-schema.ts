import { z } from "zod";
import { CreateDraftLineSchema } from "./draft-line-schema";

/** What `ticket.create` takes beyond the ticket's own details (ADR 0081 decisions 9 and 11). */
export const TicketIntakeShape = {
  templateId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "The package (ticketTemplate.list) the lines came from, for provenance only: the first " +
        "status change is recorded with trigger TEMPLATE. Its fields and lines are not applied; " +
        "send the reviewed `lines`. Needs template:read",
    ),
  lines: z
    .array(CreateDraftLineSchema)
    .max(100)
    .optional()
    .describe(
      "The ticket's lines, created with it in the entry status's states (ADR 0081): line.create " +
        "details plus `note`, `options` and `requirements`. Needs program:write, and item:read " +
        "for items and options. A line whose hard start state would clash is refused (CONFLICT " +
        "at lines.<index>); a soft overlap is prebooked",
    ),
  inboundMessageId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "The inbox message the ticket is made from (inboundMessage.list, ADR 0085): it is " +
        "attached to the new ticket in the same step. Needs inbox:read; a message that already " +
        "has a ticket is refused with CONFLICT",
    ),
  draftedFromMessage: z
    .boolean()
    .optional()
    .describe(
      "True when the values were read from a message by ticketDraft.fromMessage (ADR 0084): " +
        "the ticket's audit records that it was drafted from a message, with inboundMessageId",
    ),
  intakeKey: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe(
      "A client key that makes the create idempotent: the same key again returns the ticket " +
        "the first call created and creates nothing",
    ),
};
