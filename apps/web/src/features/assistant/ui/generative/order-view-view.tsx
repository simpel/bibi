"use client";

import { OrderView } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useOrderViewFacts } from "@/features/order/ui/use-order-view-facts";
import { Link } from "@/lib/navigation";
import { orderName } from "@/lib/order-label";
import { orderRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type OrderViewViewProps = GenerativeProps<"order-view">;

/** One order at a glance (`order.view`, ADR 0097): each fact "–" without its feature's read. */
export function OrderViewView({ order }: OrderViewViewProps) {
  const t = useTranslations("assistant.ui.order.view");
  const tOrder = useTranslations("assistant.ui.order");
  const facts = useOrderViewFacts({ order });
  const href = orderRoute({ id: order.id });
  const name = orderName({
    title: order.title,
    fallback: tOrder("reference", { reference: order.reference }),
  });
  return (
    <OrderView
      title={
        <Link href={href} className="hover:underline">
          {name}
        </Link>
      }
      status={order.currentStatus}
      facts={facts}
      hidden={t("hidden")}
      footer={
        <Link href={href} className="text-primary hover:underline">
          {tOrder("open")}
        </Link>
      }
    />
  );
}
