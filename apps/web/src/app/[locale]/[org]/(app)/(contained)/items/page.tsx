import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { ItemList } from "@/features/item/ui/item-list";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type ItemsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[]; type?: string | string[] }>;
};

export async function generateMetadata({ params }: ItemsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "items" });
}

export default async function ItemsPage({ params, searchParams }: ItemsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor, type } = await searchParams;
  setRequestLocale(locale);
  const typeId = readCursor({ value: type });
  return (
    <SimplePage>
      <ItemList locale={locale} typeId={typeId} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
