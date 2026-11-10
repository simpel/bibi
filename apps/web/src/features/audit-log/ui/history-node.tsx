import type { Locale } from "@bibi/i18n";
import type { ReactNode } from "react";
import { DeferredSection } from "@/components/states/deferred-section";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { EntityHistory } from "./entity-history";

export type HistoryNodeInput = { locale: Locale; entityType: string; entityId: string };

/** The entity's full history for the history sheet, or `null` without `audit:read` (ADR 0050). */
export async function historyNode({
  locale,
  entityType,
  entityId,
}: HistoryNodeInput): Promise<ReactNode | null> {
  if (!can({ abilities: await getCallerAbilities(), permission: "audit:read" })) return null;
  return (
    <DeferredSection>
      <EntityHistory locale={locale} entityType={entityType} entityId={entityId} />
    </DeferredSection>
  );
}
