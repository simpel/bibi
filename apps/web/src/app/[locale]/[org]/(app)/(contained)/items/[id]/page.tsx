import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadItem } from "@/features/item/load-item";
import { ItemDetail } from "@/features/item/ui/item-detail";
import { entityTitle } from "@/lib/page-metadata";

type ItemPageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: ItemPageProps) {
  const { id } = await params;
  const item = await loadItem({ id });
  return entityTitle({
    name: item.ok ? item.value.name : null,
    fallback: "Item",
  });
}

export default async function ItemPage({ params, searchParams }: ItemPageProps) {
  const [{ locale: rawLocale, id }, { tab }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <ItemDetail locale={locale} id={id} tab={tab} />;
}
