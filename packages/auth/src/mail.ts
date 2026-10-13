import { getEnv } from "@okazi/config";
import { createTransport, type Transporter } from "nodemailer";
import { z } from "zod";

export const MailMessageSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().min(1),
});

export type MailMessage = z.infer<typeof MailMessageSchema>;

/** Anything that can deliver a mail; tests install a fake via `setMailSender`. */
export type MailSender = (message: MailMessage) => Promise<void>;

let transporter: Transporter | undefined;
let override: MailSender | undefined;

const smtpSender: MailSender = async ({ to, subject, text }) => {
  const env = getEnv();
  transporter ??= createTransport(env.SMTP_URL);
  await transporter.sendMail({ from: env.MAIL_FROM, to, subject, text });
};

export type SetMailSenderInput = { sender: MailSender | undefined };

/** Replaces SMTP delivery (tests, previews). Pass `undefined` to restore SMTP. */
export function setMailSender({ sender }: SetMailSenderInput): void {
  override = sender;
}

/** Sends a plain-text mail via `SMTP_URL` (mailpit locally). */
export async function sendMail({ to, subject, text }: MailMessage): Promise<void> {
  const message = MailMessageSchema.parse({ to, subject, text });
  await (override ?? smtpSender)(message);
}
