"use client";

import type { PriceListDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchivePriceListDialog } from "./archive-price-list-dialog";

export type PriceListDangerAreaProps = { priceList: PriceListDto };

/** The price list's danger area, last on its page; archiving goes back to the list. */
export function PriceListDangerArea({ priceList }: PriceListDangerAreaProps) {
  const t = useTranslations("priceList");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: priceList.name })}
      dialog={(state) => <ArchivePriceListDialog priceList={priceList} {...state} />}
    />
  );
}
