import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { AuditEntry, type AuditEntryValue } from "./audit-entry";

export type AuditEntryListProps = {
  entries: readonly AuditEntryValue[];
  /** The viewer's date and time format, from the server or a client card's hook. */
  dates: DateTimeFormat;
};

/** Change history, newest first; shared by the history tab and the assistant's tool card. */
export function AuditEntryList({ entries, dates }: AuditEntryListProps) {
  const t = useTranslations("auditLog");
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="audit-entry-list" className="divide-y">
      {entries.map((entry) => (
        <li key={entry.id}>
          <AuditEntry entry={entry} dates={dates} />
        </li>
      ))}
    </ol>
  );
}
