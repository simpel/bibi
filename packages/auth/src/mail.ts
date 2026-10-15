import { type MailMessage, sendMail } from "@okazi/mail";

/**
 * Sends an auth mail through `@okazi/mail`. Better Auth callbacks and after-commit hooks report
 * failure by throwing, so a failed send rethrows the typed `AppError` (already logged as
 * `mail.failed`).
 */
export async function sendAuthMail({
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
}: MailMessage): Promise<void> {
  const result = await sendMail({ to, subject, text, html, replyTo, attachments });
  if (!result.ok) throw result.error;
}
