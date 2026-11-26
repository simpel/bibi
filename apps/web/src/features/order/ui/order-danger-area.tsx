"use client";

import type { OrderDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { orderName } from "@/lib/order-label";
import { ArchiveOrderDialog } from "./archive-order-dialog";

export type OrderDangerAreaProps = { order: OrderDto };

/** The order's danger area, its page's last tab: the only place it is archived. Archived orders are restored and deleted on the Archive page. */
export function OrderDangerArea({ order }: OrderDangerAreaProps) {
  const t = useTranslations("order");
  const name = orderName({
    title: order.title,
    fallback: t("reference", { reference: order.reference }),
  });
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name })}
      dialog={(state) => <ArchiveOrderDialog order={order} name={name} {...state} />}
    />
  );
}
