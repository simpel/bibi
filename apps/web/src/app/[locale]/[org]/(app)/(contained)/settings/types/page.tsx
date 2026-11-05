import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { EntityTypeList } from "@/features/entity-type/ui/entity-type-list";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type TypesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export async function generateMetadata({ params }: TypesPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "types" });
}

export default async function TypesPage({ params, searchParams }: TypesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <EntityTypeList locale={locale} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
