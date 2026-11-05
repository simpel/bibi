import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { LogSearchParams } from "@/features/admin/logs/log-params";
import { SystemLogView } from "@/features/admin/logs/system-log-view";
import { pageTitle } from "@/lib/page-metadata";

type AdminLogsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<LogSearchParams>;
};

export async function generateMetadata() {
  return pageTitle({ namespace: "admin", key: "logs.title" });
}

export default async function AdminLogsPage({ params, searchParams }: AdminLogsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <SystemLogView locale={locale} params={await searchParams} />;
}
