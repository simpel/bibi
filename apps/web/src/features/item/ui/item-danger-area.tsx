"use client";

import type { ItemDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveItemDialog } from "./archive-item-dialog";

export type ItemDangerAreaProps = { item: ItemDto };

/** The item's danger area, its page's last tab: the only place it is archived. */
export function ItemDangerArea({ item }: ItemDangerAreaProps) {
  const t = useTranslations("item");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: item.name })}
      dialog={(state) => <ArchiveItemDialog item={item} {...state} />}
    />
  );
}
