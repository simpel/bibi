import { useTranslations } from "next-intl";
import { AuditEntry, type AuditEntryValue } from "./audit-entry";

export type AuditEntryListProps = { entries: readonly AuditEntryValue[] };

/** Change history, newest first; shared by the history tab and the assistant's tool card. */
export function AuditEntryList({ entries }: AuditEntryListProps) {
  const t = useTranslations("auditLog");
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="audit-entry-list" className="divide-y">
      {entries.map((entry) => (
        <li key={entry.id}>
          <AuditEntry entry={entry} />
        </li>
      ))}
    </ol>
  );
}
