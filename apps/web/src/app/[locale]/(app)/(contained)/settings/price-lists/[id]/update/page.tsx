import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PriceListUpdate } from "@/features/price-list/ui/price-list-update";

type UpdatePriceListPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdatePriceListPage({ params }: UpdatePriceListPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <PriceListUpdate locale={locale} id={id} />;
}
