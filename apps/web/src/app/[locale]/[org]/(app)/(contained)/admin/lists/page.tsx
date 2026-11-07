import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { VocabularyList } from "@/features/vocabulary/ui/vocabulary-list";
import { pageTitle } from "@/lib/page-metadata";

type ListsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: ListsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "lists" });
}

export default async function ListsPage({ params }: ListsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <VocabularyList locale={locale} />
    </SimplePage>
  );
}
