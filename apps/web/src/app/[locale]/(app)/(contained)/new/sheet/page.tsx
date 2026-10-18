import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { SheetDefinitionCreate } from "@/features/sheet-definition/ui/sheet-definition-create";

type NewSheetDefinitionPageProps = { params: Promise<{ locale: string }> };

export default async function NewSheetDefinitionPage({ params }: NewSheetDefinitionPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <SheetDefinitionCreate locale={locale} />;
}
