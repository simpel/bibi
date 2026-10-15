import { useTranslations } from "next-intl";
import { InboundEmailEntry, type InboundEmailValue } from "./inbound-email-entry";

export type InboundEmailListProps = { emails: readonly InboundEmailValue[] };

/** Received mails, newest first; shared by the booking page and the assistant's tool card. */
export function InboundEmailList({ emails }: InboundEmailListProps) {
  const t = useTranslations("inboundEmail");
  if (emails.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="inbound-email-list" className="divide-y">
      {emails.map((email) => (
        <li key={email.id}>
          <InboundEmailEntry email={email} />
        </li>
      ))}
    </ol>
  );
}
