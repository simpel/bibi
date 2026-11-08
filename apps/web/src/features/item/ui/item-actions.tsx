import type { ItemDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { LayoutDashboardIcon, PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { itemRoute, updateRoute } from "@/lib/routes";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { layoutsRoute } from "../../floor-plan/layouts-path";
import { ArchiveItemButton } from "./archive-item-button";

export type ItemActionsProps = {
  item: ItemDto;
  abilities: CallerAbilities;
  /** The item's type has setups: the layouts open from here (ADR 0099). */
  hasLayouts: boolean;
};

/** Layouts, edit (its own page) and archive buttons of the item detail page, each by its permission. */
export async function ItemActions({ item, abilities, hasLayouts }: ItemActionsProps) {
  const t = await getTranslations("item");
  const canEdit = can({ abilities, permission: "item:write" });
  const canArchive = can({ abilities, permission: "item:delete" });
  return (
    <>
      {hasLayouts ? (
        <Button asChild variant="outline">
          <Link href={layoutsRoute({ itemId: item.id })}>
            <LayoutDashboardIcon />
            {t("layouts")}
          </Link>
        </Button>
      ) : null}
      {canEdit ? (
        <Button asChild variant="outline">
          <Link href={updateRoute({ detail: itemRoute({ id: item.id }) })}>
            <PencilIcon />
            {t("edit")}
          </Link>
        </Button>
      ) : null}
      {canArchive ? <ArchiveItemButton item={item} /> : null}
    </>
  );
}
