"use client";

import type { ItemDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { itemRoute } from "@/lib/configuration-routes";
import { Link, useRouter } from "@/lib/navigation";
import { updateRoute } from "@/lib/routes";

export type ItemRowActionsProps = {
  item: ItemDto;
  canEdit?: boolean | undefined;
};

/** Row actions in the items table: Edit (when allowed) or Open. */
export function ItemRowActions({ item, canEdit = false }: ItemRowActionsProps) {
  const t = useTranslations("item");
  const common = useTranslations("common");
  const router = useRouter();
  const detail = itemRoute({ id: item.id });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={
        canEdit
          ? [
              {
                label: t("edit"),
                icon: PencilIcon,
                onClick: () => router.push(updateRoute({ detail })),
              },
            ]
          : [
              {
                label: common("open"),
                icon: ExternalLinkIcon,
                onClick: () => router.push(detail),
              },
            ]
      }
    />
  );
}

/** Right-click context menu for an item row. */
export function ItemRowMenu({ item, canEdit = false }: ItemRowActionsProps) {
  const t = useTranslations("item");
  const common = useTranslations("common");
  const detail = itemRoute({ id: item.id });
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={detail}>
          <ExternalLinkIcon />
          {common("open")}
        </Link>
      </ContextMenuItem>
      {canEdit ? (
        <ContextMenuItem asChild>
          <Link href={updateRoute({ detail })}>
            <PencilIcon />
            {t("edit")}
          </Link>
        </ContextMenuItem>
      ) : null}
    </>
  );
}
