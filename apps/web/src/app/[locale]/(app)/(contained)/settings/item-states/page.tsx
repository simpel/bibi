import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ItemStateList } from "@/features/item-state/ui/item-state-list";

type ItemStatesPageProps = { params: Promise<{ locale: string }> };

export default async function ItemStatesPage({ params }: ItemStatesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <ItemStateList locale={locale} />;
}
