import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";

/** The longest text read into a draft; a longer message is cut there. */
export const DRAFT_TEXT_MAX = 20_000;

export const TicketDraftFromMessageInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1)
      .max(DRAFT_TEXT_MAX)
      .optional()
      .describe("A pasted request in the customer's own words"),
    inboundMessageId: z
      .string()
      .min(1)
      .optional()
      .describe("An inbox message (inboundMessage.list) to read instead; needs inbox:read"),
  })
  .refine((input) => Boolean(input.text) !== Boolean(input.inboundMessageId), {
    message: "Give either text or inboundMessageId",
    path: ["text"],
  });

const Evidence = {
  quote: z.string().describe("The exact text the value came from; empty when nothing says it"),
  guessed: z
    .boolean()
    .describe("True when inferred rather than stated, or when the quote is not in the message"),
};

export const DraftTextSchema = z.object({ value: z.string(), ...Evidence });

export const DraftDateSchema = z.object({
  value: PlainDateStringSchema.describe("The day in the organization's zone"),
  asWritten: z.string(),
  ...Evidence,
});

export const DraftInstantSchema = z.object({
  value: z.date().describe("The instant, resolved in the organization's zone (ADR 0064)"),
  asWritten: z.string(),
  ...Evidence,
});

export const DraftCountSchema = z.object({ value: z.number().int(), ...Evidence });

export const DraftNeedSchema = z.object({
  value: z.string().describe("The need as the message names it, or the list value it matched"),
  count: z.number().int(),
  vocabularyValueId: z
    .string()
    .nullable()
    .describe("The organization's active list value it matched; null stays text to ask about"),
  ...Evidence,
});

/** The draft of a ticket read from a message (ADR 0084): a value with evidence per field. */
export const TicketDraftSchema = z.object({
  sender: DraftTextSchema.nullable().describe("The sender's name"),
  company: DraftTextSchema.nullable(),
  email: DraftTextSchema.nullable(),
  phone: DraftTextSchema.nullable(),
  date: DraftDateSchema.nullable(),
  start: DraftInstantSchema.nullable(),
  end: DraftInstantSchema.nullable(),
  headcount: DraftCountSchema.nullable(),
  wish: DraftTextSchema.nullable().describe("The request in the customer's words"),
  package: DraftTextSchema.nullable().describe("The suggested package, by name"),
  needs: z.array(DraftNeedSchema),
  notes: DraftTextSchema.nullable(),
  customerId: z
    .string()
    .nullable()
    .describe("The customer matched by email domain, then name (needs customer:read)"),
  contactId: z.string().nullable().describe("The contact with the sender's email at it"),
  templateId: z.string().nullable().describe("The suggested active package (ticketTemplate)"),
  inboundMessageId: z.string().nullable(),
  timeZone: z.string().describe("The zone the date and times were resolved in"),
});

export type TicketDraftFromMessageInput = z.infer<typeof TicketDraftFromMessageInputSchema>;
export type DraftText = z.infer<typeof DraftTextSchema>;
export type DraftNeed = z.infer<typeof DraftNeedSchema>;
export type TicketDraft = z.infer<typeof TicketDraftSchema>;
