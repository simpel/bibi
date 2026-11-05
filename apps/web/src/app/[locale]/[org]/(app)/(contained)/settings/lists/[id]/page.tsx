import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadVocabulary } from "@/features/vocabulary/load-vocabulary";
import { VocabularyDetail } from "@/features/vocabulary/ui/vocabulary-detail";
import { entityTitle } from "@/lib/page-metadata";

type ListPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: ListPageProps) {
  const { id } = await params;
  const res = await loadVocabulary({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "List",
  });
}

export default async function ListPage({ params }: ListPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <VocabularyDetail locale={locale} id={id} />
    </SimplePage>
  );
}
