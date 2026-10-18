import type { ItemDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { itemRoute, updateRoute } from "@/lib/routes";
import { ArchiveItemButton } from "./archive-item-button";

export type ItemActionsProps = { item: ItemDto };

/** Edit (its own page) and archive buttons of the item detail page. */
export async function ItemActions({ item }: ItemActionsProps) {
  const t = await getTranslations("item");
  return (
    <>
      <Button asChild variant="outline">
        <Link href={updateRoute({ detail: itemRoute({ id: item.id }) })}>
          <PencilIcon />
          {t("edit")}
        </Link>
      </Button>
      <ArchiveItemButton item={item} />
    </>
  );
}
