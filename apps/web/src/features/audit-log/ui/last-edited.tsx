import { listAuditLogs } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { RelativeTime } from "@/components/relative-time";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

export type LastEditedProps = { entityType: string; entityId: string };

/** "Edited 2 days ago by Anna Berg" from the latest audit entry; nothing without `audit:read` or an entry. */
export async function LastEdited({ entityType, entityId }: LastEditedProps) {
  if (!can({ abilities: await getCallerAbilities(), permission: "audit:read" })) return null;
  const result = await runOperation({
    operation: listAuditLogs,
    input: { entityType, entityId, limit: 1 },
  });
  const entry = result.ok ? result.value.items[0] : undefined;
  if (!entry) return null;
  const t = await getTranslations("auditLog");
  const time = () => <RelativeTime instant={entry.createdAt} />;
  return (
    <p className="text-sm text-muted-foreground">
      {entry.actorType === "AI"
        ? t.rich("editedByAssistant", { time })
        : t.rich("edited", { time, name: entry.actorName ?? t(`actor.${entry.actorType}`) })}
    </p>
  );
}
