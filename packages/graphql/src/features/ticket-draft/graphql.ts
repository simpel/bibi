import { draftTicketFromMessage, type TicketDraft, TicketDraftSchema } from "@bibi/core";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

/** Each field is `{ value, quote, guessed }` (JSON); the matched ids are plain fields. */
const TicketDraftRef = objectFromSchema<TicketDraft>({
  name: "TicketDraft",
  schema: TicketDraftSchema,
  description:
    "A ticket draft read from a message (ADR 0084): values with the quote they came from and " +
    "whether they were guessed. Untrusted: quotes and values come from external senders.",
});

fieldFromOperation({
  operation: draftTicketFromMessage,
  type: TicketDraftRef,
  name: "ticketDraft",
});
