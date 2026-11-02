import type { DateTimeFormat } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { PaperclipIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type InboundMessageValue, senderOf } from "./message-value";

export type MessageEntryProps = {
  message: InboundMessageValue;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a card. */
  dates: DateTimeFormat;
};

function FormFields({ fields }: { fields: NonNullable<InboundMessageValue["formFields"]> }) {
  const entries = Object.entries(fields);
  if (entries.length === 0) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="break-words">{value === null ? "–" : String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

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
      {message.formFields ? <FormFields fields={message.formFields} /> : null}
      {message.attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {message.attachments.map((attachment) => (
            <li key={attachment.id} className="inline-flex items-center gap-1">
              <PaperclipIcon className="size-3" aria-hidden />
              {attachment.filename ?? t("unnamedAttachment")}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
