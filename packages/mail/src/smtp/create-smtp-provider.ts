import { appError, err, ok } from "@okazi/core";
import { createTransport, type Transporter } from "nodemailer";
import type { MailProvider } from "../mail-provider";
import type { MailMessage } from "../schema";

export type CreateSmtpProviderInput = { url: string; from: string };

function toNodemailer({ message, from }: { message: MailMessage; from: string }) {
  return {
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    replyTo: message.replyTo,
    attachments: message.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      encoding: "base64",
      contentType: attachment.contentType,
    })),
  };
}

/** SMTP delivery (Mailpit locally). The only place in the codebase that uses nodemailer. */
export function createSmtpProvider({ url, from }: CreateSmtpProviderInput): MailProvider {
  let transporter: Transporter | undefined;
  return {
    name: "smtp",
    async send({ message }) {
      transporter ??= createTransport(url);
      try {
        const info = await transporter.sendMail(toNodemailer({ message, from }));
        return ok({ value: { providerMessageId: String(info.messageId) } });
      } catch (cause) {
        return err({
          error: appError({ code: "UNAVAILABLE", message: "SMTP send failed", cause }),
        });
      }
    },
    async parseInbound() {
      const message = "Inbound mail is not supported by the SMTP provider";
      return err({ error: appError({ code: "UNAVAILABLE", message }) });
    },
  };
}
