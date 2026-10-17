import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ItemList } from "@/features/item/ui/item-list";
import { readCursor } from "@/lib/page-cursor";

type ItemsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[]; type?: string | string[] }>;
};

export default async function ItemsPage({ params, searchParams }: ItemsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor, type } = await searchParams;
  setRequestLocale(locale);
  const typeId = readCursor({ value: type });
  return <ItemList locale={locale} typeId={typeId} cursor={readCursor({ value: cursor })} />;
}
