import type { Result } from "@okazi/core";
import type {
  InboundMail,
  InboundMailContent,
  InboundRequest,
  MailMessage,
  SentMail,
} from "./schema";

export type MailProviderName = "smtp" | "resend" | "memory";

export type SendInput = { message: MailMessage };

export type ParseInboundInput = { request: InboundRequest };

export type FetchInboundInput = { providerEmailId: string };

/**
 * The one seam to email (ADR 0012). Adapters: SMTP (Mailpit in dev), Resend (prod) and an
 * in-memory one for tests. `parseInbound` verifies a webhook and returns `null` for events that
 * are not mail; `fetchInbound` then loads the body and attachment metadata from the provider.
 */
export type MailProvider = {
  readonly name: MailProviderName;
  send(input: SendInput): Promise<Result<SentMail>>;
  parseInbound(input: ParseInboundInput): Promise<Result<InboundMail | null>>;
  fetchInbound(input: FetchInboundInput): Promise<Result<InboundMailContent>>;
};
