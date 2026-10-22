import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { VocabularyDetail } from "@/features/vocabulary/ui/vocabulary-detail";

type ListPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function ListPage({ params }: ListPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <VocabularyDetail locale={locale} id={id} />;
}
