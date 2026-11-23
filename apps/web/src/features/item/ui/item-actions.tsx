import type { ItemDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { itemOrderHref } from "../../order/intake/intake-slot";
import { ItemMoreMenu } from "./item-more-menu";

export type ItemActionsProps = {
  item: ItemDto;
  abilities: CallerAbilities;
  /** The history list for the "View history" sheet; `null` without `audit:read`. */
  history: ReactNode | null;
};

/**
 * The item page's actions: Create order with this item (`order:write`), then the ⋯ menu with
 * history and Archive. Everything else on the page is edited in place.
 */
export async function ItemActions({ item, abilities, history }: ItemActionsProps) {
  const t = await getTranslations("item.page");
  const canOrder = can({ abilities, permission: "order:write" }) && item.status === "ACTIVE";
  return (
    <>
      {canOrder ? (
        <Button asChild>
          <Link href={itemOrderHref({ itemId: item.id })}>
            <PlusIcon />
            {t("createOrder")}
          </Link>
        </Button>
      ) : null}
      <ItemMoreMenu
        item={item}
        history={history}
        canArchive={can({ abilities, permission: "item:delete" })}
      />
    </>
  );
}
