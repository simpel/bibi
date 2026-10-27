import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { InboundEmailEntry, type InboundEmailValue } from "./inbound-email-entry";

export type InboundEmailListProps = {
  emails: readonly InboundEmailValue[];
  /** The viewer's date and time format, from the server or a client card's hook. */
  dates: DateTimeFormat;
};

/** Received mails, newest first; shared by the ticket page and the assistant's tool card. */
export function InboundEmailList({ emails, dates }: InboundEmailListProps) {
  const t = useTranslations("inboundEmail");
  if (emails.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="inbound-email-list" className="divide-y">
      {emails.map((email) => (
        <li key={email.id}>
          <InboundEmailEntry email={email} dates={dates} />
        </li>
      ))}
    </ol>
  );
}
