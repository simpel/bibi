import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadEntityType } from "@/features/entity-type/load-entity-type";
import { EntityTypeDetail } from "@/features/entity-type/ui/entity-type-detail";
import { entityTitle } from "@/lib/page-metadata";

type TypePageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: TypePageProps) {
  const { id } = await params;
  const res = await loadEntityType({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "Type",
  });
}

export default async function TypePage({ params }: TypePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <EntityTypeDetail locale={locale} id={id} />
    </SimplePage>
  );
}
