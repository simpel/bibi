import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadPriceList } from "@/features/price-list/load-price-list";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadPriceListFormData } from "./load-price-list-form-data";
import { PriceListUpdateForm } from "./price-list-update-form";

export type PriceListUpdateProps = { locale: Locale; id: string };

/** `/admin/price-lists/[id]/update`: edit on a page of its own. */
export async function PriceListUpdate({ locale, id }: PriceListUpdateProps) {
  const t = await getTranslations("priceList");
  const [priceList, data] = await Promise.all([loadPriceList({ id }), loadPriceListFormData()]);
  if (!priceList.ok)
    return <ErrorState errorKey={handleLoadError({ error: priceList.error, locale })} />;
  return (
    <>
      <CrumbName href={`/admin/price-lists/${id}/update`} name={priceList.value.name} />
      <FormPageShell
        backHref={ROUTES.adminPriceLists}
        title={t("edit")}
        description={t("editDescription")}
      >
        <PriceListUpdateForm priceList={priceList.value} data={data} />
      </FormPageShell>
    </>
  );
}
