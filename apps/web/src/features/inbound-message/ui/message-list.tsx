import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { MessageEntry } from "./message-entry";
import type { InboundMessageValue } from "./message-value";

export type MessageListProps = {
  messages: readonly InboundMessageValue[];
  /** The viewer's date and time format, from the server or a client card's hook. */
  dates: DateTimeFormat;
};

/** Inbound messages, newest first; shared by the order page and the assistant's tool card. */
export function MessageList({ messages, dates }: MessageListProps) {
  const t = useTranslations("inbox");
  if (messages.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="message-list" className="divide-y">
      {messages.map((message) => (
        <li key={message.id}>
          <MessageEntry message={message} dates={dates} />
        </li>
      ))}
    </ol>
  );
}
