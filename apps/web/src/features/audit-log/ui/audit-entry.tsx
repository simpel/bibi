import type { AuditLogDto, DateTimeFormat } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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

/** One change: when, who (with the assistant marker and approver), the operation and the diff. */
export function AuditEntry({ entry, dates: format }: AuditEntryProps) {
  const t = useTranslations("auditLog");
  const when = format.dateTime({ instant: entry.createdAt });
  const who = entry.actorName ?? t(`actor.${entry.actorType}`);
  return (
    <article data-slot="audit-entry" className="grid gap-2 py-3 text-sm">
      <header className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{who}</span>
        {entry.actorType === "AI" ? (
          <Badge variant="secondary" className="gap-1">
            <SparklesIcon className="size-3" aria-hidden />
            {t("aiProposed")}
          </Badge>
        ) : null}
        <code className="text-xs text-muted-foreground">{entry.operation}</code>
        <time
          className="ml-auto text-xs text-muted-foreground"
          dateTime={new Date(entry.createdAt).toISOString()}
        >
          {when}
        </time>
      </header>
      {entry.actorType === "AI" && entry.approvedBy ? (
        <p className="text-xs text-muted-foreground">
          {t("approvedBy", { name: entry.approvedByName ?? t("unknownActor") })}
        </p>
      ) : null}
      <AuditChanges changes={auditDiff({ before: entry.before, after: entry.after })} />
    </article>
  );
}
