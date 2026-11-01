import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { ItemStateList } from "@/features/item-state/ui/item-state-list";

type ItemStatesPageProps = { params: Promise<{ locale: string }> };

export default async function ItemStatesPage({ params }: ItemStatesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <ItemStateList locale={locale} />
    </SimplePage>
  );
}
