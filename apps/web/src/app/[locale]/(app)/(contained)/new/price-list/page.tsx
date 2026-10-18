import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PriceListCreate } from "@/features/price-list/ui/price-list-create";

type NewPriceListPageProps = { params: Promise<{ locale: string }> };

export default async function NewPriceListPage({ params }: NewPriceListPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <PriceListCreate />;
}
