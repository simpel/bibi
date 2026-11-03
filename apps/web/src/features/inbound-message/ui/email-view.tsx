import { useTranslations } from "next-intl";
import { MessageAttachments, MessageFields } from "./message-fields";
import { MessageHeader } from "./message-header";
import type { MessageViewProps } from "./message-view";

/**
 * A mail as a mail client shows it: who sent it (name, then address) and when, a rule, the body
 * at reading width, then attachments. Written by an outside sender: text, never markup.
 */
export function EmailView({ message, received }: MessageViewProps) {
  const t = useTranslations("inbox");
  const name = message.fromName ?? message.fromEmail ?? t("unknownSender");
  const address = message.fromName && message.fromEmail ? `<${message.fromEmail}>` : undefined;
  return (
    <article data-slot="email-view" className="overflow-hidden rounded-lg border bg-card">
      <MessageHeader sender={name} detail={address} received={received} />
      <div className="grid gap-6 px-5 py-6">
        <p className="max-w-prose whitespace-pre-wrap break-words text-base leading-relaxed">
          {message.text || <span className="text-muted-foreground">{t("noBody")}</span>}
        </p>
        {message.formFields ? <MessageFields fields={message.formFields} /> : null}
      </div>
      {message.attachments.length > 0 ? (
        <footer className="border-t px-5 py-3">
          <MessageAttachments attachments={message.attachments} />
        </footer>
      ) : null}
    </article>
  );
}
