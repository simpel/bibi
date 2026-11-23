import type { ItemDto } from "@bibi/core";
import type { ReactNode } from "react";
import { HistoryMenu } from "@/features/audit-log/ui/history-sheet";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { ArchiveItemButton } from "./archive-item-button";

export type ItemActionsProps = {
  item: ItemDto;
  abilities: CallerAbilities;
  /** The history list for the "View history" sheet; `null` without `audit:read`. */
  history: ReactNode | null;
};

/**
 * Archive and the more menu with history, each by its permission. Everything else on the item
 * page is edited in place, its layouts from their own cards (no Edit or Layouts button here).
 */
export function ItemActions({ item, abilities, history }: ItemActionsProps) {
  const canArchive = can({ abilities, permission: "item:delete" });
  return (
    <>
      {canArchive ? <ArchiveItemButton item={item} /> : null}
      {history ? <HistoryMenu history={history} /> : null}
    </>
  );
}
