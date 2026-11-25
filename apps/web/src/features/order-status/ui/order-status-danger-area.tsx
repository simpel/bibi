"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveOrderStatusDialog } from "./archive-order-status-dialog";

export type OrderStatusDangerAreaProps = {
  orderStatus: OrderStatusDto;
  /** Every active status: the others are where its orders can move. */
  statuses: readonly OrderStatusDto[];
};

/** The status's danger area, last on its page: the only place it is archived. */
export function OrderStatusDangerArea({ orderStatus, statuses }: OrderStatusDangerAreaProps) {
  const t = useTranslations("orderStatus");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: orderStatus.name })}
      dialog={(state) => (
        <ArchiveOrderStatusDialog orderStatus={orderStatus} statuses={statuses} {...state} />
      )}
    />
  );
}
