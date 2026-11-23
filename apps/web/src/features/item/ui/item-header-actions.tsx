"use client";

import type { ItemDto } from "@bibi/core";
import { HeaderActions, type TitleRowAction } from "@bibi/ui";
import { ArchiveIcon, HistoryIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { HistorySheet } from "@/features/audit-log/ui/history-sheet";
import { useRouter } from "@/lib/navigation";
import { itemOrderHref } from "../../order/intake/intake-slot";
import { ArchiveItemDialog } from "./archive-item-dialog";

export type ItemHeaderActionsProps = {
  item: ItemDto;
  /** `order:write` on an active item: Create order with it. */
  canOrder: boolean;
  /** `item:delete`. */
  canArchive: boolean;
  /** The history list; null without `audit:read`. */
  history: ReactNode | null;
};

/**
 * The item page's actions: Create order with this item, View history and Archive item. On a
 * narrow page they fold into one menu, so the title keeps its row.
 */
export function ItemHeaderActions({ item, canOrder, canArchive, history }: ItemHeaderActionsProps) {
  const t = useTranslations("item");
  const audit = useTranslations("auditLog");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState<"history" | "archive" | null>(null);
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
    ...(history
      ? [
          {
            id: "history",
            label: audit("viewHistory"),
            icon: <HistoryIcon aria-hidden />,
            variant: "outline" as const,
            onSelect: () => setOpen("history"),
          },
        ]
      : []),
    ...(canArchive
      ? [
          {
            id: "archive",
            label: t("archive"),
            icon: <ArchiveIcon aria-hidden />,
            variant: "outline" as const,
            onSelect: () => setOpen("archive"),
          },
        ]
      : []),
  ];
  return (
    <>
      <HeaderActions actions={actions} moreLabel={common("actions")} foldBy="header" />
      {history ? (
        <HistorySheet
          open={open === "history"}
          onOpenChange={(next) => !next && setOpen(null)}
          history={history}
        />
      ) : null}
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
