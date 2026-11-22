import type { OrderDto, OrderStatusDto } from "@bibi/core";
import { Alert, AlertDescription } from "@bibi/ui";
import { LockIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";

export type ClosedOrderNoticeProps = {
  order: Pick<OrderDto, "statusChangedAt">;
  status: OrderStatusDto;
};

/** One quiet line above a closed order's title: it is a record now, so its edit controls are gone. */
export async function ClosedOrderNotice({ order, status }: ClosedOrderNoticeProps) {
  const [t, format] = await Promise.all([getTranslations("order"), getDateTimeFormat()]);
  const date = format.date({ instant: order.statusChangedAt });
  return (
    <Alert data-slot="closed-order-notice">
      <LockIcon className="size-4" />
      <AlertDescription>{t("closedNotice", { status: status.name, date })}</AlertDescription>
    </Alert>
  );
}
