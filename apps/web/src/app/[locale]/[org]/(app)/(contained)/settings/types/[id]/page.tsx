import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { EntityTypeDetail } from "@/features/entity-type/ui/entity-type-detail";

type TypePageProps = { params: Promise<{ locale: string; id: string }> };

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
