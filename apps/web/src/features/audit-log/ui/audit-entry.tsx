import type { AuditLogDto, DateTimeFormat } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import { auditDiff } from "../audit-diff";
import { AuditChanges } from "./audit-changes";

/** An audit entry as the server (Date) or a tool result (ISO string) carries it. */
export type AuditEntryValue = Omit<AuditLogDto, "createdAt" | "pseudonymisedAt"> & {
  createdAt: Date | string;
  pseudonymisedAt: Date | string | null;
};

export type AuditEntryProps = {
  entry: AuditEntryValue;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
};

/** The verb of an operation name (`item.update` → `update`), for the entry's sentence. */
const verbOf = ({ operation }: { operation: string }) => operation.split(".").at(-1) ?? "";

/**
 * One change as a sentence: who did what and when ("Anna Berg edited · 2 hours ago", the exact
 * time in a tooltip), the assistant marker and approver, then the changed details. A create lists
 * no details: the record itself shows them.
 */
export function AuditEntry({ entry }: AuditEntryProps) {
  const t = useTranslations("auditLog");
  const who = entry.actorName ?? t(`actor.${entry.actorType}`);
  const verb = verbOf({ operation: entry.operation });
  return (
    <article data-slot="audit-entry" className="grid gap-2 py-4">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span>
          <span className="font-medium">{who}</span> {t("did", { verb })}
        </span>
        {entry.actorType === "AI" ? (
          <Badge variant="secondary" className="gap-1">
            <SparklesIcon className="size-3" aria-hidden />
            {t("aiProposed")}
          </Badge>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">
          <RelativeTime instant={entry.createdAt} />
        </span>
      </header>
      {entry.actorType === "AI" && entry.approvedBy ? (
        <p className="text-xs text-muted-foreground">
          {t("approvedBy", { name: entry.approvedByName ?? t("unknownActor") })}
        </p>
      ) : null}
      {verb === "create" ? null : (
        <AuditChanges changes={auditDiff({ before: entry.before, after: entry.after })} />
      )}
    </article>
  );
}
