import { type MailMessage, setMailSender } from "../src/index";

/** Captures mails instead of sending them over SMTP. */
export function installFakeMail(): MailMessage[] {
  const outbox: MailMessage[] = [];
  setMailSender({
    sender: async (message) => {
      outbox.push(message);
    },
  });
  return outbox;
}
