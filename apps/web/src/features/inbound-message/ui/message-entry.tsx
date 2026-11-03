import type { DateTimeFormat } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { MessageAttachments, MessageFields } from "./message-fields";
import { type InboundMessageValue, senderOf } from "./message-value";

export type MessageEntryProps = {
  message: InboundMessageValue;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a card. */
  dates: DateTimeFormat;
};

/**
 * One inbound message of any channel (ADR 0085): sender, channel, time, subject, the plain text,
 * form fields and attachment names. Written by outside senders: shown as text, never as markup.
 */
export function MessageEntry({ message, dates }: MessageEntryProps) {
  const t = useTranslations("inbox");
  const received = new Date(message.receivedAt);
  return (
    <article data-slot="message-entry" className="grid gap-2 py-3 text-sm">
      <header className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{senderOf({ message }) ?? t("unknownSender")}</span>
        <Badge variant="secondary">{t(`channels.${message.channel}`)}</Badge>
        <time className="ml-auto text-xs text-muted-foreground" dateTime={received.toISOString()}>
          {dates.dateTime({ instant: received })}
        </time>
      </header>
      <p className="font-medium">{message.subject ?? t("noSubject")}</p>
      <p className="whitespace-pre-wrap break-words text-muted-foreground">
        {message.text || t("noBody")}
      </p>
      {message.formFields ? <MessageFields fields={message.formFields} /> : null}
      <MessageAttachments attachments={message.attachments} />
    </article>
  );
}
