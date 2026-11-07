import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadOrderTemplateData } from "../load-order-template-data";
import { OrderTemplatePageForm } from "./order-template-page-form";

export type OrderTemplateCreateProps = { locale: Locale };

/** `/new/order-template`: create a predefined order on a page of its own. */
export async function OrderTemplateCreate({ locale }: OrderTemplateCreateProps) {
  const t = await getTranslations("orderTemplate");
  const data = await loadOrderTemplateData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.adminOrderTemplates}
      title={t("create")}
      description={t("createDescription")}
    >
      <OrderTemplatePageForm data={data.value} />
    </FormPageShell>
  );
}
