"use client";

import type { ItemDto } from "@bibi/core";
import { HeaderActions, type TitleRowAction } from "@bibi/ui";
import { ArchiveIcon, EllipsisIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { itemOrderHref } from "../../order/intake/intake-slot";
import { ArchiveItemDialog } from "./archive-item-dialog";

export type ItemHeaderActionsProps = {
  item: ItemDto;
  /** `order:write` on an active item: Create order with it. */
  canOrder: boolean;
  /** `item:delete`. */
  canArchive: boolean;
};

/**
 * The item page's actions: Create order with this item, and Archive item in the ⋯
 * menu (history is the page's last tab). On a
 * narrow page they fold into one menu, so the title keeps its row.
 */
export function ItemHeaderActions({ item, canOrder, canArchive }: ItemHeaderActionsProps) {
  const t = useTranslations("item");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState<"archive" | null>(null);
  const actions: TitleRowAction[] = [
    ...(canOrder
      ? [
          {
            id: "order",
            label: t("page.createOrder"),
            icon: <PlusIcon aria-hidden />,
            variant: "default" as const,
            onSelect: () => router.push(itemOrderHref({ itemId: item.id })),
          },
        ]
      : []),
    // Archiving is rare: it waits in the ⋯ menu and confirms in a dialog.
    ...(canArchive
      ? [
          {
            id: "more",
            label: common("actions"),
            icon: <EllipsisIcon aria-hidden />,
            variant: "outline" as const,
            overflow: true,
            items: [
              {
                id: "archive",
                label: t("archive"),
                icon: <ArchiveIcon aria-hidden />,
                onSelect: () => setOpen("archive"),
              },
            ],
          },
        ]
      : []),
  ];
  return (
    <>
      <HeaderActions actions={actions} moreLabel={common("actions")} foldBy="header" />
      {canArchive ? (
        <ArchiveItemDialog
          item={item}
          open={open === "archive"}
          onOpenChange={(next) => !next && setOpen(null)}
        />
      ) : null}
    </>
  );
}
