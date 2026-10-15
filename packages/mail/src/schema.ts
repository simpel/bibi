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

/** A raw webhook request as the HTTP entry point received it (body unparsed for signatures). */
export type InboundRequest = { headers: Headers; body: string };
