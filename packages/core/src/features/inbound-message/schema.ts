import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { InboundAttachmentSchema } from "../inbound-email/schema";

/** The channels a message comes in on (ADR 0085): a closed list, a new one is a code change. */
export const INBOUND_CHANNELS = ["EMAIL", "WEB_FORM", "SMS", "API"] as const;
export const InboundChannelSchema = z.enum(INBOUND_CHANNELS);

/** Named values a channel delivers as structure (a web form's fields, an API caller's request). */
export const FormFieldsSchema = z
  .record(
    z.string().min(1).max(100),
    z.union([z.string().max(10_000), z.number(), z.boolean(), z.null()]),
  )
  .refine((fields) => Object.keys(fields).length <= 50, { message: "At most 50 fields" })
  .describe('Named values, e.g. { "date": "2026-12-21", "guests": 14 }');

/**
 * A message received on any channel (ADR 0085). Its content is never edited; only `ticketId`
 * (set once) and the team's shared read state change. Channel-specific `details` stay with the channel's code.
 */
export const InboundMessageSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  channel: InboundChannelSchema,
  endpointId: z.string().nullable(),
  fromName: z.string().nullable(),
  fromEmail: z.string().nullable(),
  fromPhone: z.string().nullable(),
  subject: z.string().nullable(),
  text: z.string(),
  formFields: FormFieldsSchema.nullable(),
  attachments: z.array(InboundAttachmentSchema),
  externalId: z.string(),
  receivedAt: z.date(),
  ticketId: z.string().nullable(),
  readAt: z.date().nullable().describe("When someone in the team read it; null is unread"),
  readBy: z.string().nullable(),
  createdAt: z.date(),
});

export const InboundMessageListInputSchema = z.object({
  ...PageInputShape,
  ticketId: z
    .string()
    .min(1)
    .optional()
    .describe("A ticket's messages of every channel. Without it: the inbox (no ticket yet)"),
  read: z
    .boolean()
    .optional()
    .describe("Only read (true) or only unread (false) messages; without it both"),
  channel: InboundChannelSchema.optional().describe("Only messages of this channel"),
});

export const InboundMessageListOutputSchema = z.object({
  items: z.array(InboundMessageSchema),
  nextCursor: z.string().nullable(),
});

export const InboundMessageOpenCountInputSchema = z.object({});

export const InboundMessageOpenCountOutputSchema = z.object({
  open: z
    .number()
    .int()
    .min(0)
    .describe("Unread inbox messages: no ticket yet and nobody in the team has read them"),
});

export const InboundMessageIdInputSchema = z.object({ id: z.string().min(1) });

export const InboundMessageAttachInputSchema = z.object({
  id: z.string().min(1).describe("The inbound message"),
  ticketId: z.string().min(1).describe("The active ticket to attach it to (needs ticket:write)"),
});

export const InboundMessageSubmitInputSchema = z.object({
  endpointId: z
    .string()
    .min(1)
    .describe("The organization's API endpoint (inboundEndpoint.list, channel API)"),
  subject: z.string().trim().min(1).max(2000).optional(),
  text: z.string().trim().min(1).max(20_000).describe("The request in the caller's own words"),
  formFields: FormFieldsSchema.optional(),
});

export type InboundChannel = z.infer<typeof InboundChannelSchema>;
export type FormFields = z.infer<typeof FormFieldsSchema>;
export type InboundMessageDto = z.infer<typeof InboundMessageSchema>;
export type InboundMessageListInput = z.infer<typeof InboundMessageListInputSchema>;
export type InboundMessagePage = z.infer<typeof InboundMessageListOutputSchema>;
export type InboundMessageSubmitInput = z.infer<typeof InboundMessageSubmitInputSchema>;
