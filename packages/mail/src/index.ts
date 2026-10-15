export {
  getMailProvider,
  type ProviderFromEnvInput,
  providerFromEnv,
  type SetMailProviderInput,
  setMailProvider,
} from "./get-mail-provider";
export type {
  MailProvider,
  MailProviderName,
  ParseInboundInput,
  SendInput,
} from "./mail-provider";
export { createMemoryMailProvider, type MemoryMailProvider } from "./memory-provider";
export {
  type CreateResendProviderInput,
  createResendProvider,
  RESEND_API_URL,
  type ResendRequest,
  type ResendTransport,
} from "./resend/create-resend-provider";
export {
  type SignSvixPayloadInput,
  signSvixPayload,
  type VerifySvixSignatureInput,
  verifySvixSignature,
} from "./resend/verify-svix-signature";
export {
  type InboundMail,
  InboundMailSchema,
  type InboundRequest,
  type MailAttachment,
  MailAttachmentSchema,
  type MailMessage,
  MailMessageSchema,
  type SentMail,
  SentMailSchema,
} from "./schema";
export { sendMail } from "./send-mail";
export { type CreateSmtpProviderInput, createSmtpProvider } from "./smtp/create-smtp-provider";
