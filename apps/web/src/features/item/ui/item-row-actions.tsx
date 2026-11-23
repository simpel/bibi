"use client";

import type { ItemDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { itemRoute } from "@/lib/configuration-routes";
import { Link, useRouter } from "@/lib/navigation";

export type ItemRowActionsProps = { item: ItemDto };

/** Row action in the items table: Open (the item is edited in place on its page). */
export function ItemRowActions({ item }: ItemRowActionsProps) {
  const common = useTranslations("common");
  const router = useRouter();
  const detail = itemRoute({ id: item.id });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={[
        { label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) },
      ]}
    />
  );
}

/** Right-click context menu for an item row. */
export function ItemRowMenu({ item }: ItemRowActionsProps) {
  const common = useTranslations("common");
  return (
    <ContextMenuItem asChild>
      <Link href={itemRoute({ id: item.id })}>
        <ExternalLinkIcon />
        {common("open")}
      </Link>
    </ContextMenuItem>
  );
}
