import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadOrder } from "@/features/order/load-order";
import { orderRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadOrderData } from "../load-order-data";
import { loadOrderStatuses } from "../load-order-names";
import { closedStatus } from "../order-abilities";
import { ClosedOrderNotice } from "./closed-order-notice";
import { OrderUpdateForm } from "./order-update-form";

export type OrderUpdateProps = { locale: Locale; id: string };

/** `/orders/[id]/update`: edit the order on a page of its own; a closed order shows why it cannot. */
export async function OrderUpdate({ locale, id }: OrderUpdateProps) {
  const t = await getTranslations("order");
  const [order, data, statuses] = await Promise.all([
    loadOrder({ id }),
    loadOrderData(),
    loadOrderStatuses(),
  ]);
  if (!order.ok) return <ErrorState errorKey={handleLoadError({ error: order.error, locale })} />;
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const closed = statuses.ok
    ? closedStatus({ order: order.value, statuses: statuses.value })
    : null;
  return (
    <>
      <CrumbName
        href={orderRoute({ id })}
        name={
          order.value.reference
            ? `#${order.value.reference} ${order.value.title ?? ""}`.trim()
            : (order.value.title ?? "Order")
        }
      />
      <FormPageShell
        backHref={orderRoute({ id })}
        title={t("edit")}
        description={t("editDescription")}
      >
        {closed ? (
          <ClosedOrderNotice order={order.value} status={closed} />
        ) : (
          <OrderUpdateForm order={order.value} data={data.value} />
        )}
      </FormPageShell>
    </>
  );
}
