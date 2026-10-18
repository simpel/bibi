import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { SheetDefinitionUpdate } from "@/features/sheet-definition/ui/sheet-definition-update";

type UpdateSheetDefinitionPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateSheetDefinitionPage({
  params,
}: UpdateSheetDefinitionPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <SheetDefinitionUpdate locale={locale} id={id} />;
}
