import type { ItemDto } from "@bibi/core";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { ItemHeaderActions } from "./item-header-actions";

export type ItemActionsProps = {
  item: ItemDto;
  abilities: CallerAbilities;
};

/** The item page's header action by its permission (`ItemHeaderActions`). */
export function ItemActions({ item, abilities }: ItemActionsProps) {
  return (
    <ItemHeaderActions
      item={item}
      canOrder={can({ abilities, permission: "order:write" }) && item.status === "ACTIVE"}
    />
  );
}
