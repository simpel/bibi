import type { ItemDto } from "@bibi/core";
import type { ReactNode } from "react";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { ItemHeaderActions } from "./item-header-actions";

export type ItemActionsProps = {
  item: ItemDto;
  abilities: CallerAbilities;
  /** The history list for the "View history" sheet; `null` without `audit:read`. */
  history: ReactNode | null;
};

/** The item page's header actions, each by its permission (`ItemHeaderActions`). */
export function ItemActions({ item, abilities, history }: ItemActionsProps) {
  return (
    <ItemHeaderActions
      item={item}
      canOrder={can({ abilities, permission: "order:write" }) && item.status === "ACTIVE"}
      canArchive={can({ abilities, permission: "item:delete" })}
      history={history}
    />
  );
}
