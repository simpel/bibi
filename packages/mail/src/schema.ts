import { z } from "zod";

/** A file attached to an outgoing mail. `content` is base64 (Resend's wire format). */
export const MailAttachmentSchema = z.object({
  filename: z.string().min(1),
  content: z.base64(),
  contentType: z.string().min(1).optional(),
});

export type MailAttachment = z.infer<typeof MailAttachmentSchema>;

/** An outgoing mail. `text` is always sent; `html` is the optional rich alternative. */
export const MailMessageSchema = z.object({
  to: z.email(),
  subject: z.string().min(1),
  text: z.string().min(1),
  html: z.string().min(1).optional(),
  replyTo: z.email().optional(),
  attachments: z.array(MailAttachmentSchema).max(20).optional(),
});

export type MailMessage = z.infer<typeof MailMessageSchema>;

/** What a provider reports back after accepting a mail. */
export const SentMailSchema = z.object({ providerMessageId: z.string().min(1) });

export type SentMail = z.infer<typeof SentMailSchema>;

/**
 * Metadata of a received mail (ADR 0012). Body and attachments are fetched separately from the
 * provider by `providerEmailId`, never carried in the webhook.
 */
export const InboundMailSchema = z.object({
  providerEmailId: z.string().min(1),
  messageId: z.string().nullable(),
  from: z.string().min(1),
  to: z.array(z.string().min(1)),
  subject: z.string().nullable(),
  receivedAt: z.string().nullable(),
});

export type InboundMail = z.infer<typeof InboundMailSchema>;

/** Metadata of a received attachment; the bytes stay with the provider. */
export const InboundAttachmentMetaSchema = z.object({
  id: z.string().min(1),
  filename: z.string().nullable(),
  contentType: z.string().nullable(),
  size: z.number().int().min(0).nullable(),
});

export type InboundAttachmentMeta = z.infer<typeof InboundAttachmentMetaSchema>;

/** A received mail with its body, fetched from the provider by `providerEmailId` (ADR 0012). */
export const InboundMailContentSchema = InboundMailSchema.extend({
  cc: z.array(z.string().min(1)),
  /** Addresses the provider received the mail for (covers Bcc and forwarding). */
  receivedFor: z.array(z.string().min(1)),
  text: z.string().nullable(),
  html: z.string().nullable(),
  attachments: z.array(InboundAttachmentMetaSchema),
});

export type InboundMailContent = z.infer<typeof InboundMailContentSchema>;

/** A raw webhook request as the HTTP entry point received it (body unparsed for signatures). */
export type InboundRequest = { headers: Headers; body: string };
