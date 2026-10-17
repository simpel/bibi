import type { Locale } from "@okazi/i18n";
import type { ReactNode } from "react";
import { EntityHistory } from "./entity-history";
import { HistoryTabs } from "./history-tabs";

export type WithHistoryProps = {
  locale: Locale;
  entityType: string;
  entityId: string;
  children: ReactNode;
};

/** Wraps a detail page body in details/history tabs (every role reads the audit log, ADR 0034). */
export async function WithHistory({ locale, entityType, entityId, children }: WithHistoryProps) {
  const history = <EntityHistory locale={locale} entityType={entityType} entityId={entityId} />;
  return <HistoryTabs details={children} history={history} />;
}
