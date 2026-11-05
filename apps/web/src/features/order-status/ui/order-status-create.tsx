import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { OrderStatusPageForm } from "./order-status-page-form";

/** `/new/order-status`: create a status on a page of its own. */
export async function OrderStatusCreate() {
  const t = await getTranslations("orderStatus");
  return (
    <FormPageShell
      backHref={ROUTES.settingsPipeline}
      title={t("create")}
      description={t("createDescription")}
    >
      <OrderStatusPageForm />
    </FormPageShell>
  );
}
