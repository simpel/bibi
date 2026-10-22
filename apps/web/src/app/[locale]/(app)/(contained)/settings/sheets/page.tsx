import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { SheetDefinitionList } from "@/features/sheet-definition/ui/sheet-definition-list";
import { readCursor } from "@/lib/page-cursor";

type SheetsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function SheetsPage({ params, searchParams }: SheetsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <SheetDefinitionList locale={locale} cursor={readCursor({ value: cursor })} />;
}
