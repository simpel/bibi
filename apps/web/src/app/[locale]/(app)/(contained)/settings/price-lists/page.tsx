import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PriceListList } from "@/features/price-list/ui/price-list-list";
import { readCursor } from "@/lib/page-cursor";

type PriceListsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function PriceListsPage({ params, searchParams }: PriceListsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <PriceListList locale={locale} cursor={readCursor({ value: cursor })} />;
}
