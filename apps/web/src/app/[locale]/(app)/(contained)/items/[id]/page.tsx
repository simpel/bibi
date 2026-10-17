import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ItemDetail } from "@/features/item/ui/item-detail";

type ItemPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function ItemPage({ params }: ItemPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <ItemDetail locale={locale} id={id} />;
}
