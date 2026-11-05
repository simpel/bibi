import { z } from "zod";
import { INBOUND_BODY_MAX, InboundAttachmentSchema } from "../inbound-email/schema";
import { FormFieldsSchema } from "./schema";

const address = z.string().min(1).max(1000);

/**
 * The EMAIL channel's `details` (ADR 0085): the headers threading and the old `inboundEmail.*`
 * aliases need. Read only by the email code (`features/inbound-email/`).
 */
export const EmailDetailsSchema = z.object({
  messageId: z.string().max(1000).nullable(),
  fromAddress: address,
  toAddresses: z.array(address).max(100),
  html: z.string().max(INBOUND_BODY_MAX).nullable(),
});

const ReceiveShape = {
  endpointId: z.string().min(1).nullable().describe("The endpoint it came in on"),
  orderId: z
    .string()
    .min(1)
    .nullable()
    .describe("Reply hint: the order a reply route (an order address) names"),
  fromName: z.string().max(500).nullable(),
  fromEmail: z.string().max(1000).nullable(),
  fromPhone: z.string().max(100).nullable(),
  subject: z.string().max(2000).nullable(),
  text: z.string().max(INBOUND_BODY_MAX),
  formFields: FormFieldsSchema.nullable(),
  attachments: z.array(InboundAttachmentSchema).max(100),
  externalId: z.string().min(1).max(200).describe("The provider's id of the message"),
  receivedAt: z.coerce.date(),
};

/**
 * What a channel adapter hands to `inboundMessage.receive` (SYSTEM only), one variant per built
 * channel with its own `details` schema. WEB_FORM and SMS are added with their adapters.
 */
export const InboundMessageReceiveInputSchema = z.discriminatedUnion("channel", [
  z.object({ ...ReceiveShape, channel: z.literal("EMAIL"), details: EmailDetailsSchema }),
]);

export type EmailDetails = z.infer<typeof EmailDetailsSchema>;
export type InboundMessageReceiveInput = z.infer<typeof InboundMessageReceiveInputSchema>;
