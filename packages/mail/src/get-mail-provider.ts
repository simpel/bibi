import { type Env, getEnv } from "@bibi/config";
import type { MailProvider } from "./mail-provider";
import { createResendProvider } from "./resend/create-resend-provider";
import { createSmtpProvider } from "./smtp/create-smtp-provider";

let configured: MailProvider | undefined;
let override: MailProvider | undefined;

export type ProviderFromEnvInput = { env: Env };

/** The adapter `MAIL_PROVIDER` selects: `smtp` (default, Mailpit in dev) or `resend`. */
export function providerFromEnv({ env }: ProviderFromEnvInput): MailProvider {
  if (env.MAIL_PROVIDER === "resend") {
    // `@bibi/config` refuses MAIL_PROVIDER=resend without RESEND_API_KEY.
    return createResendProvider({
      apiKey: env.RESEND_API_KEY ?? "",
      from: env.MAIL_FROM,
      webhookSecret: env.RESEND_WEBHOOK_SECRET || undefined,
    });
  }
  return createSmtpProvider({ url: env.SMTP_URL, from: env.MAIL_FROM });
}

/** The process-wide provider: a test override if set, otherwise the env-selected adapter. */
export function getMailProvider(): MailProvider {
  if (override) return override;
  configured ??= providerFromEnv({ env: getEnv() });
  return configured;
}

export type SetMailProviderInput = { provider: MailProvider | undefined };

/** Replaces the env-selected adapter (tests, previews). Pass `undefined` to restore it. */
export function setMailProvider({ provider }: SetMailProviderInput): void {
  override = provider;
}
