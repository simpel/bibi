import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { RunSheetDefinitionList } from "@/features/run-sheet-definition/ui/run-sheet-definition-list";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type RunSheetsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export async function generateMetadata({ params }: RunSheetsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "runSheets" });
}

export default async function RunSheetsPage({ params, searchParams }: RunSheetsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <RunSheetDefinitionList locale={locale} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
