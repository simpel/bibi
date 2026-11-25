"use client";

import type { ItemDto } from "@bibi/core";
import { HeaderActions, type TitleRowAction } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { itemOrderHref } from "../../order/intake/intake-slot";

export type ItemHeaderActionsProps = {
  item: ItemDto;
  /** `order:write` on an active item: Create order with it. */
  canOrder: boolean;
};

/**
 * The item page's action: Create order with this item. Archiving is in the danger area, the
 * page's last tab. On a narrow page it folds, so the title keeps its row.
 */
export function ItemHeaderActions({ item, canOrder }: ItemHeaderActionsProps) {
  const t = useTranslations("item");
  const common = useTranslations("common");
  const router = useRouter();
  const actions: TitleRowAction[] = canOrder
    ? [
        {
          id: "order",
          label: t("page.createOrder"),
          icon: <PlusIcon aria-hidden />,
          variant: "default" as const,
          onSelect: () => router.push(itemOrderHref({ itemId: item.id })),
        },
      ]
    : [];
  return <HeaderActions actions={actions} moreLabel={common("actions")} foldBy="header" />;
}
