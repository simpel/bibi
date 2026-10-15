import type { Locale } from "@okazi/i18n";
import type { ReactNode } from "react";
import { getCallerAbilities } from "@/server/caller-abilities";
import { EntityHistory } from "./entity-history";
import { HistoryTabs } from "./history-tabs";

export type WithHistoryProps = {
  locale: Locale;
  entityType: string;
  entityId: string;
  children: ReactNode;
};

/** Wraps a detail page body in details/history tabs when the caller may read the audit log. */
export async function WithHistory({ locale, entityType, entityId, children }: WithHistoryProps) {
  const { auditRead } = await getCallerAbilities();
  if (!auditRead) return <>{children}</>;
  const history = <EntityHistory locale={locale} entityType={entityType} entityId={entityId} />;
  return <HistoryTabs details={children} history={history} />;
}
