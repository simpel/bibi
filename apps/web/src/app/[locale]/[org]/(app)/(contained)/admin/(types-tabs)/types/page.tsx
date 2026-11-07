import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { EntityTypeList } from "@/features/entity-type/ui/entity-type-list";
import { pageTitle } from "@/lib/page-metadata";

type TypesPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: TypesPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "types" });
}

export default async function TypesPage({ params }: TypesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <EntityTypeList locale={locale} inTab />;
}
