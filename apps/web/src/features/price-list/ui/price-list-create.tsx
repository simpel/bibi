import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { loadPriceListFormData } from "./load-price-list-form-data";
import { PriceListWizard } from "./price-list-wizard";

/** `/new/price-list`: the step-by-step create page. */
export async function PriceListCreate() {
  const t = await getTranslations("priceList");
  const data = await loadPriceListFormData();
  return (
    <FormPageShell
      backHref={ROUTES.settingsPriceLists}
      title={t("create")}
      description={t("createDescription")}
    >
      <PriceListWizard data={data} />
    </FormPageShell>
  );
}
