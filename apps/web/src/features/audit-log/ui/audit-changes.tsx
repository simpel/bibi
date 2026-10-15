import { useTranslations } from "next-intl";
import { type AuditChange, formatAuditValue } from "../audit-diff";

export type AuditChangesProps = { changes: readonly AuditChange[] };

/** The changed fields of one audit entry: field, old value struck through, new value. */
export function AuditChanges({ changes }: AuditChangesProps) {
  const t = useTranslations("auditLog");
  if (changes.length === 0)
    return <p className="text-xs text-muted-foreground">{t("noChanges")}</p>;
  return (
    <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1 text-xs">
      {changes.map(({ field, before, after }) => (
        <div key={field} className="contents">
          <dt className="font-medium text-muted-foreground">{field}</dt>
          <dd className="flex flex-wrap items-center gap-1 break-all">
            {before !== undefined ? (
              <>
                <del className="text-muted-foreground">{formatAuditValue({ value: before })}</del>
                <span aria-hidden>→</span>
              </>
            ) : null}
            <ins className="no-underline">{formatAuditValue({ value: after })}</ins>
          </dd>
        </div>
      ))}
    </dl>
  );
}
