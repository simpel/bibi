import { useTranslations } from "next-intl";
import { fieldKey } from "@/features/assistant/lib/approval-labels";
import type { AuditChange } from "../audit-diff";

export type AuditChangesProps = { changes: readonly AuditChange[] };

/** Fields that only say how the record is wired (ids, status): the sentence already tells. */
const technical = ({ field }: { field: string }) =>
  field === "status" || /Ids?$/.test(field) || field === "icon";

const plain = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === "" || typeof value !== "object";

/**
 * The changed details of one history entry in plain words: the detail's name, its new value and,
 * muted under it, what it was. Ids and wiring are left out, lists and objects just say "changed",
 * and details without a name are counted at the end.
 */
export function AuditChanges({ changes }: AuditChangesProps) {
  const t = useTranslations("auditLog");
  const label = useTranslations("assistant.approval.fields");
  const text = ({ value }: { value: unknown }) =>
    value === undefined || value === null || value === "" ? t("emptyValue") : String(value);
  const shown = changes.filter((change) => !technical(change));
  const named = shown.filter(({ field }) => fieldKey({ key: field }) !== null);
  const unnamed = shown.length - named.length;
  if (named.length === 0 && unnamed === 0) return null;
  return (
    <dl className="grid gap-2 text-sm">
      {named.map(({ field, before, after }) => {
        const key = fieldKey({ key: field });
        const simple = plain({ value: before }) && plain({ value: after });
        return (
          <div key={field} className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">{key ? label(key) : field}</dt>
            <dd className="whitespace-pre-line break-words">
              {simple ? text({ value: after }) : t("changed")}
            </dd>
            {simple && before !== undefined ? (
              <dd className="line-clamp-2 text-xs text-muted-foreground">
                {t("was", { value: text({ value: before }) })}
              </dd>
            ) : null}
          </div>
        );
      })}
      {unnamed > 0 ? (
        <p className="text-xs text-muted-foreground">{t("otherChanges", { count: unnamed })}</p>
      ) : null}
    </dl>
  );
}
