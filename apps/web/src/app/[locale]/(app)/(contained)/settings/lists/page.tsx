import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { VocabularyList } from "@/features/vocabulary/ui/vocabulary-list";
import { readCursor } from "@/lib/page-cursor";

type ListsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function ListsPage({ params, searchParams }: ListsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <VocabularyList locale={locale} cursor={readCursor({ value: cursor })} />;
}
