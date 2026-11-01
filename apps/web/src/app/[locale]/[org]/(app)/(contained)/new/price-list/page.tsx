import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { PriceListCreate } from "@/features/price-list/ui/price-list-create";

type NewPriceListPageProps = { params: Promise<{ locale: string }> };

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
