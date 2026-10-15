import type { Result } from "@okazi/core";
import type { InboundMail, InboundRequest, MailMessage, SentMail } from "./schema";

export type MailProviderName = "smtp" | "resend" | "memory";

export type SendInput = { message: MailMessage };

export type ParseInboundInput = { request: InboundRequest };

/**
 * The one seam to email (ADR 0012). Adapters: SMTP (Mailpit in dev), Resend (prod) and an
 * in-memory one for tests. `parseInbound` returns `null` for webhook events that are not mail.
 */
export type MailProvider = {
  readonly name: MailProviderName;
  send(input: SendInput): Promise<Result<SentMail>>;
  parseInbound(input: ParseInboundInput): Promise<Result<InboundMail | null>>;
};
