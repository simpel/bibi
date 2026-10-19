import { getPriceList } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadPriceListFormData } from "./load-price-list-form-data";
import { PriceListUpdateForm } from "./price-list-update-form";

export type PriceListUpdateProps = { locale: Locale; id: string };

/** `/settings/price-lists/[id]/update`: edit on a page of its own. */
export async function PriceListUpdate({ locale, id }: PriceListUpdateProps) {
  const t = await getTranslations("priceList");
  const [priceList, data] = await Promise.all([
    runOperation({ operation: getPriceList, input: { id } }),
    loadPriceListFormData(),
  ]);
  if (!priceList.ok)
    return <ErrorState errorKey={handleLoadError({ error: priceList.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsPriceLists}
      title={t("edit")}
      description={t("editDescription")}
    >
      <PriceListUpdateForm priceList={priceList.value} data={data} />
    </FormPageShell>
  );
}
