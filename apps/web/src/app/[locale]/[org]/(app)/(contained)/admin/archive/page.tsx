import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { ArchivedRecordsSection } from "@/features/archive/ui/archived-records-section";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "archive" });
}

export default async function ArchivePage({ params }: PageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "archive" });
  return (
    <AdminSections title={title}>
      {show.has("archivedRecords") ? <ArchivedRecordsSection locale={locale} /> : null}
    </AdminSections>
  );
}
