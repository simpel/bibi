import { appError, err, fromZodError, type Result } from "@okazi/core";
import { elapsedMs, getLogger, maskEmail } from "@okazi/logger";
import { getMailProvider } from "./get-mail-provider";
import { type MailMessage, MailMessageSchema, type SentMail } from "./schema";

/**
 * Sends a mail through the configured `MailProvider`. Logs `mail.sent`/`mail.failed` with the
 * recipient masked; never logs the body.
 */
export async function sendMail({
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
}: MailMessage): Promise<Result<SentMail>> {
  const parsed = MailMessageSchema.safeParse({ to, subject, text, html, replyTo, attachments });
  if (!parsed.success) return err({ error: fromZodError({ error: parsed.error }) });
  const provider = getMailProvider();
  const fields = {
    provider: provider.name,
    recipient: maskEmail({ email: parsed.data.to }),
    subject: parsed.data.subject,
  };
  const since = performance.now();
  const result = await provider
    .send({ message: parsed.data })
    .catch((cause: unknown) =>
      err({ error: appError({ code: "INTERNAL", message: "Mail provider threw", cause }) }),
    );
  if (result.ok) {
    getLogger().info({ event: "mail.sent", ...fields, durationMs: elapsedMs({ since }) });
  } else {
    getLogger().error({ event: "mail.failed", ...fields, err: result.error });
  }
  return result;
}
