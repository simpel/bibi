import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { VocabularyList } from "@/features/vocabulary/ui/vocabulary-list";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type ListsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export async function generateMetadata({ params }: ListsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "lists" });
}

export default async function ListsPage({ params, searchParams }: ListsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <VocabularyList locale={locale} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
