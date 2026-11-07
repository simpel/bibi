import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ItemStateList } from "@/features/item-state/ui/item-state-list";
import { pageTitle } from "@/lib/page-metadata";

type ItemStatesPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: ItemStatesPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "itemStates" });
}

export default async function ItemStatesPage({ params }: ItemStatesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <ItemStateList locale={locale} inTab />;
}
