import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { RunSheetDefinitionList } from "@/features/run-sheet-definition/ui/run-sheet-definition-list";
import { pageTitle } from "@/lib/page-metadata";

type RunSheetsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RunSheetsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "runSheets" });
}

export default async function RunSheetsPage({ params }: RunSheetsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <RunSheetDefinitionList locale={locale} inTab />;
}
