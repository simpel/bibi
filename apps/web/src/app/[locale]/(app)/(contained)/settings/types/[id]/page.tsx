import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { EntityTypeDetail } from "@/features/entity-type/ui/entity-type-detail";

type TypePageProps = { params: Promise<{ locale: string; id: string }> };

export default async function TypePage({ params }: TypePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <EntityTypeDetail locale={locale} id={id} />;
}
