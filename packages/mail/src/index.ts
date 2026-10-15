export {
  getMailProvider,
  type ProviderFromEnvInput,
  providerFromEnv,
  type SetMailProviderInput,
  setMailProvider,
} from "./get-mail-provider";
export {
  type CreateInboundWebhookHandlerInput,
  createInboundWebhookHandler,
} from "./inbound/create-inbound-webhook-handler";
export type {
  FetchInboundInput,
  MailProvider,
  MailProviderName,
  ParseInboundInput,
  SendInput,
} from "./mail-provider";
export { createMemoryMailProvider, type MemoryMailProvider } from "./memory-provider";
export {
  type CreateResendProviderInput,
  createResendProvider,
} from "./resend/create-resend-provider";
export {
  RESEND_API_URL,
  type ResendRequest,
  type ResendTransport,
} from "./resend/resend-transport";
export {
  type SignSvixPayloadInput,
  signSvixPayload,
  type VerifySvixSignatureInput,
  verifySvixSignature,
} from "./resend/verify-svix-signature";
export {
  type InboundAttachmentMeta,
  InboundAttachmentMetaSchema,
  type InboundMail,
  type InboundMailContent,
  InboundMailContentSchema,
  InboundMailSchema,
  type InboundRequest,
  type MailAttachment,
  MailAttachmentSchema,
  type MailMessage,
  MailMessageSchema,
  type SentMail,
  SentMailSchema,
} from "./schema";
export { type SendBookingMailInput, sendBookingMail } from "./send-booking-mail";
export { sendMail } from "./send-mail";
export { type CreateSmtpProviderInput, createSmtpProvider } from "./smtp/create-smtp-provider";
