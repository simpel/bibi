import { type SendMailInput, sendMail } from "@bibi/mail";

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

/** Sends the password reset link. */
export async function sendPasswordResetMail({
  to,
  url,
}: {
  to: string;
  url: string;
}): Promise<void> {
  await sendAuthMail({
    kind: "auth.password-reset",
    to,
    subject: "Reset your password",
    text: url,
  });
}
