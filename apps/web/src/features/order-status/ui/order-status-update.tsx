import { listOrderStatuses } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadOrderStatus } from "@/features/order-status/load-order-status";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { OrderStatusPageForm } from "./order-status-page-form";
import { StatusFlowCard } from "./status-flow-card";

export type OrderStatusUpdateProps = { locale: Locale; id: string };

/** `/admin/pipeline/[id]/update`: edit a status on a page of its own. */
export async function OrderStatusUpdate({ locale, id }: OrderStatusUpdateProps) {
  const [t, flow, orderStatus, all] = await Promise.all([
    getTranslations("orderStatus"),
    getTranslations("orderStatus.flow"),
    loadOrderStatus({ id }),
    runOperation({ operation: listOrderStatuses, input: { limit: 100 } }),
  ]);
  if (!orderStatus.ok)
    return <ErrorState errorKey={handleLoadError({ error: orderStatus.error, locale })} />;
  return (
    <>
      <CrumbName href={`/admin/pipeline/${id}/update`} name={orderStatus.value.name} />
      <FormPageShell
        backHref={ROUTES.adminPipeline}
        title={t("edit")}
        description={t("editDescription")}
      >
        <OrderStatusPageForm orderStatus={orderStatus.value} />
        {all.ok ? (
          <section className="mt-8 grid max-w-2xl gap-3">
            <h2 className="text-lg font-semibold">{flow("title")}</h2>
            <p className="text-sm text-muted-foreground">{flow("description")}</p>
            <StatusFlowCard orderStatus={orderStatus.value} statuses={all.value.items} />
          </section>
        ) : null}
      </FormPageShell>
    </>
  );
}
