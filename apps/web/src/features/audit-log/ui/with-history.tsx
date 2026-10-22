import type { Locale } from "@bibi/i18n";
import type { ReactNode } from "react";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { EntityHistory } from "./entity-history";
import { HistoryTabs } from "./history-tabs";

export type WithHistoryProps = {
  locale: Locale;
  entityType: string;
  entityId: string;
  children: ReactNode;
};

/** Wraps a detail page body in details/history tabs (only with `audit:read`; without it just the body, ADR 0050). */
export async function WithHistory({ locale, entityType, entityId, children }: WithHistoryProps) {
  if (!can({ abilities: await getCallerAbilities(), permission: "audit:read" })) return children;
  const history = <EntityHistory locale={locale} entityType={entityType} entityId={entityId} />;
  return <HistoryTabs details={children} history={history} />;
}
