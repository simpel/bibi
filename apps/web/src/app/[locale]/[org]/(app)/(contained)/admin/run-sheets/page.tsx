import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { ResponsibilityList } from "@/features/responsibility/ui/responsibility-list";
import { RunSheetDefinitionList } from "@/features/run-sheet-definition/ui/run-sheet-definition-list";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "runSheets" });
}

export default async function RunSheetsPage({ params }: PageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "runSheets" });
  return (
    <AdminSections title={title}>
      {show.has("runSheets") ? <RunSheetDefinitionList locale={locale} /> : null}
      {show.has("responsibilities") ? <ResponsibilityList locale={locale} /> : null}
    </AdminSections>
  );
}
