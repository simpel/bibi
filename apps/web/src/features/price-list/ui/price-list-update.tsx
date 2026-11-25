import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadPriceList } from "@/features/price-list/load-price-list";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadPriceListFormData } from "./load-price-list-form-data";
import { PriceListDangerArea } from "./price-list-danger-area";
import { PriceListUpdateForm } from "./price-list-update-form";

export type PriceListUpdateProps = { locale: Locale; id: string };

/** `/admin/price-lists/[id]/update`: edit on a page of its own, the danger area last. */
export async function PriceListUpdate({ locale, id }: PriceListUpdateProps) {
  const [t, abilities, priceList, data] = await Promise.all([
    getTranslations("priceList"),
    getCallerAbilities(),
    loadPriceList({ id }),
    loadPriceListFormData(),
  ]);
  if (!priceList.ok)
    return <ErrorState errorKey={handleLoadError({ error: priceList.error, locale })} />;
  return (
    <>
      <CrumbName href={`/admin/price-lists/${id}/update`} name={priceList.value.name} />
      <FormPageShell title={t("edit")} description={t("editDescription")}>
        <PriceListUpdateForm priceList={priceList.value} data={data} />
      </FormPageShell>
      {can({ abilities, permission: "priceList:delete" }) ? (
        <PriceListDangerArea priceList={priceList.value} />
      ) : null}
    </>
  );
}
