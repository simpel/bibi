import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";

/** Longest stored text or HTML body; longer bodies are cut (the provider keeps the original). */
export const INBOUND_BODY_MAX = 1_000_000;

/** Metadata of a received attachment. The bytes stay with the mail provider. */
export const InboundAttachmentSchema = z.object({
  id: z.string().min(1).max(200).describe("The provider's attachment id"),
  filename: z.string().max(500).nullable(),
  contentType: z.string().max(200).nullable(),
  size: z.number().int().min(0).nullable().describe("Size in bytes"),
});

/** A mail received on a booking's inbound address (ADR 0012). Never edited. */
export const InboundEmailSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  bookingId: z.string(),
  providerEmailId: z.string(),
  messageId: z.string().nullable(),
  fromAddress: z.string(),
  toAddresses: z.array(z.string()),
  subject: z.string().nullable(),
  text: z.string().nullable(),
  html: z.string().nullable(),
  attachments: z.array(InboundAttachmentSchema),
  receivedAt: z.date(),
  createdAt: z.date(),
  createdBy: z.string().nullable(),
});

export const InboundEmailListInputSchema = z.object({
  ...PageInputShape,
  bookingId: z.string().min(1).describe("Id of the booking whose received mails to list"),
});

export const InboundEmailListOutputSchema = z.object({
  items: z.array(InboundEmailSchema),
  nextCursor: z.string().nullable(),
});

export const InboundEmailIdInputSchema = z.object({ id: z.string().min(1) });

const address = z.string().min(1).max(1000);

/** What the inbound webhook hands to `inboundEmail.receive` (SYSTEM only). */
export const InboundEmailReceiveInputSchema = z.object({
  bookingId: z.string().min(1),
  providerEmailId: z.string().min(1).max(200),
  messageId: z.string().max(1000).nullable(),
  fromAddress: address,
  toAddresses: z.array(address).max(100),
  subject: z.string().max(2000).nullable(),
  text: z.string().max(INBOUND_BODY_MAX).nullable(),
  html: z.string().max(INBOUND_BODY_MAX).nullable(),
  attachments: z.array(InboundAttachmentSchema).max(100),
  receivedAt: z.coerce.date(),
});

export type InboundAttachment = z.infer<typeof InboundAttachmentSchema>;
export type InboundEmailDto = z.infer<typeof InboundEmailSchema>;
export type InboundEmailListInput = z.infer<typeof InboundEmailListInputSchema>;
export type InboundEmailPage = z.infer<typeof InboundEmailListOutputSchema>;
export type InboundEmailReceiveInput = z.infer<typeof InboundEmailReceiveInputSchema>;
