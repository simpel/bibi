import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadOrderStatus } from "@/features/order-status/load-order-status";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { OrderStatusPageForm } from "./order-status-page-form";

export type OrderStatusUpdateProps = { locale: Locale; id: string };

/** `/settings/pipeline/[id]/update`: edit a status on a page of its own. */
export async function OrderStatusUpdate({ locale, id }: OrderStatusUpdateProps) {
  const t = await getTranslations("orderStatus");
  const orderStatus = await loadOrderStatus({ id });
  if (!orderStatus.ok)
    return <ErrorState errorKey={handleLoadError({ error: orderStatus.error, locale })} />;
  return (
    <>
      <CrumbName href={`/settings/pipeline/${id}/update`} name={orderStatus.value.name} />
      <FormPageShell
        backHref={ROUTES.settingsPipeline}
        title={t("edit")}
        description={t("editDescription")}
      >
        <OrderStatusPageForm orderStatus={orderStatus.value} />
      </FormPageShell>
    </>
  );
}
