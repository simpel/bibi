import type { Locale } from "@bibi/i18n";
import { renderPasswordResetEmail, type SendMailInput, sendMail } from "@bibi/mail";
import { resolveUserLocale } from "./user-locale";

/**
 * Sends an auth mail through `@bibi/mail`. Better Auth callbacks and after-commit hooks report
 * failure by throwing, so a failed send rethrows the typed `AppError` (already logged as
 * `mail.failed`).
 */
export async function sendAuthMail({
  kind,
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
}: SendMailInput): Promise<void> {
  const result = await sendMail({ kind, to, subject, text, html, replyTo, attachments });
  if (!result.ok) throw result.error;
}

export type SendPasswordResetMailInput = {
  to: string;
  url: string;
  userId?: string;
  locale?: Locale;
};

/** Sends the password reset link. */
export async function sendPasswordResetMail({
  to,
  url,
  userId,
  locale: explicitLocale,
}: SendPasswordResetMailInput): Promise<void> {
  const locale = explicitLocale ?? (await resolveUserLocale({ email: to, userId }));
  const email = renderPasswordResetEmail({ url, locale });
  await sendAuthMail({
    kind: "auth.password-reset",
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
