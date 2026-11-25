import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { handleLoadError } from "@/server/load-error";
import { loadOrderTemplateData } from "../load-order-template-data";
import { OrderTemplatePageForm } from "./order-template-page-form";

export type OrderTemplateCreateProps = { locale: Locale };

/** `/new/order-template`: the template's details; its lines are added on its page next. */
export async function OrderTemplateCreate({ locale }: OrderTemplateCreateProps) {
  const t = await getTranslations("orderTemplate");
  const data = await loadOrderTemplateData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell title={t("create")} description={t("createDescription")}>
      <OrderTemplatePageForm data={data.value} />
    </FormPageShell>
  );
}
