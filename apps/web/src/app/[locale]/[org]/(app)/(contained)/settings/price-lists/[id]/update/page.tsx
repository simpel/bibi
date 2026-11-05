import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadPriceList } from "@/features/price-list/load-price-list";
import { PriceListUpdate } from "@/features/price-list/ui/price-list-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdatePriceListPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdatePriceListPageProps) {
  const { id } = await params;
  const priceList = await loadPriceList({ id });
  return entityTitle({
    name: priceList.ok ? priceList.value.name : null,
    fallback: "Price list",
    prefix: "Edit",
  });
}

export default async function UpdatePriceListPage({ params }: UpdatePriceListPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="priceList:write">
        <PriceListUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
