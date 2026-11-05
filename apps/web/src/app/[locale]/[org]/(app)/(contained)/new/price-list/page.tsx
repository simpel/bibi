import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { PriceListCreate } from "@/features/price-list/ui/price-list-create";
import { pageTitle } from "@/lib/page-metadata";

type NewPriceListPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: NewPriceListPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "priceList", key: "create" });
}

export default async function NewPriceListPage({ params }: NewPriceListPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <SimplePage>
      <PermissionGate permission="priceList:write">
        <PriceListCreate />
      </PermissionGate>
    </SimplePage>
  );
}
