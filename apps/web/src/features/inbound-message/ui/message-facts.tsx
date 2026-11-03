import type { DateTimeFormat } from "@bibi/core/schemas";
import { StatCard, StatCards } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { InboundMessageValue } from "./message-value";

export type MessageFactsProps = { message: InboundMessageValue; dates: DateTimeFormat };

/** Who sent the message and when it came in, as stat cards above the message. */
export function MessageFacts({ message, dates }: MessageFactsProps) {
  const t = useTranslations("inbox");
  const contact = message.fromEmail ?? message.fromPhone ?? undefined;
  const sender = message.fromName ?? contact ?? t("unknownSender");
  const received = new Date(message.receivedAt);
  return (
    <StatCards>
      <StatCard
        label={t("columns.sender")}
        value={<span className="block truncate">{sender}</span>}
        hint={message.fromName ? contact : undefined}
      />
      <StatCard
        label={t("columns.received")}
        value={dates.dateTime({ instant: received })}
        hint={t(`channels.${message.channel}`)}
      />
    </StatCards>
  );
}
