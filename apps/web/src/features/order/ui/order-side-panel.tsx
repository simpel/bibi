import type { OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { DeferredSection } from "@/components/states/deferred-section";
import { OrderBalanceFacts } from "@/features/payment/ui/order-balance-facts";
import { orderRoute } from "@/lib/routes";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import {
  OrderAssignmentSection,
  OrderCustomerSection,
  OrderDetailsSection,
} from "./order-data-sections";

export type OrderSidePanelProps = { locale: Locale; order: OrderDto; abilities: CallerAbilities };

/**
 * The order's facts beside its tabs: who it is for, who works it, its balance in short, then the
 * details and own fields. Each streams in on its own. In the narrow panel every fact list is one
 * column.
 */
export function OrderSidePanel({ locale, order, abilities }: OrderSidePanelProps) {
  return (
    <aside
      data-tour="order.details"
      className="grid content-start gap-8 rounded-xl border bg-card p-5 [&_dl]:grid-cols-1"
    >
      <DeferredSection rows={2}>
        <OrderCustomerSection locale={locale} order={order} />
      </DeferredSection>
      <DeferredSection rows={2}>
        <OrderAssignmentSection locale={locale} order={order} />
      </DeferredSection>
      {can({ abilities, permission: "payment:read" }) ? (
        <DeferredSection rows={1}>
          <OrderBalanceFacts
            orderId={order.id}
            moneyHref={`${orderRoute({ id: order.id })}?tab=money`}
          />
        </DeferredSection>
      ) : null}
      <DeferredSection rows={3}>
        <OrderDetailsSection locale={locale} order={order} />
      </DeferredSection>
    </aside>
  );
}
