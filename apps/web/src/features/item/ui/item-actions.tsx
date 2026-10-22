import type { ItemDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { itemRoute, updateRoute } from "@/lib/routes";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { ArchiveItemButton } from "./archive-item-button";

export type ItemActionsProps = { item: ItemDto; abilities: CallerAbilities };

/** Edit (its own page) and archive buttons of the item detail page, each by its permission. */
export async function ItemActions({ item, abilities }: ItemActionsProps) {
  const t = await getTranslations("item");
  const canEdit = can({ abilities, permission: "item:write" });
  const canArchive = can({ abilities, permission: "item:delete" });
  return (
    <>
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
