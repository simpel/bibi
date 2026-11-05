import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadOrder } from "@/features/order/load-order";
import { orderRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadOrderData } from "../load-order-data";
import { OrderUpdateForm } from "./order-update-form";

export type OrderUpdateProps = { locale: Locale; id: string };

/** `/orders/[id]/update`: edit the order on a page of its own. */
export async function OrderUpdate({ locale, id }: OrderUpdateProps) {
  const t = await getTranslations("order");
  const [order, data] = await Promise.all([loadOrder({ id }), loadOrderData()]);
  if (!order.ok) return <ErrorState errorKey={handleLoadError({ error: order.error, locale })} />;
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
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
        <OrderUpdateForm order={order.value} data={data.value} />
      </FormPageShell>
    </>
  );
}
