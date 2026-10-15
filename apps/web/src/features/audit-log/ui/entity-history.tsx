import { listAuditLogs } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { AuditEntryList } from "./audit-entry-list";

export type EntityHistoryProps = { locale: Locale; entityType: string; entityId: string };

const LIMIT = 50;

/** History tab body: the latest changes to one entity from the audit log (`auditLog.list`). */
export async function EntityHistory({ locale, entityType, entityId }: EntityHistoryProps) {
  const result = await runOperation({
    operation: listAuditLogs,
    input: { entityType, entityId, limit: LIMIT },
  });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return <AuditEntryList entries={result.value.items} />;
}
