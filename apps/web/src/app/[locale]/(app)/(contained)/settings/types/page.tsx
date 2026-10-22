import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { EntityTypeList } from "@/features/entity-type/ui/entity-type-list";
import { readCursor } from "@/lib/page-cursor";

type TypesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function TypesPage({ params, searchParams }: TypesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <EntityTypeList locale={locale} cursor={readCursor({ value: cursor })} />;
}
