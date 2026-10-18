import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ItemCreate } from "@/features/item/ui/item-create";
import { readCursor } from "@/lib/page-cursor";

type NewItemPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
};

export default async function NewItemPage({ params, searchParams }: NewItemPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <ItemCreate locale={locale} typeId={readCursor({ value: (await searchParams).type })} />;
}
