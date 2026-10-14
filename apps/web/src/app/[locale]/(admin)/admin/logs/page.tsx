import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { LogSearchParams } from "@/features/admin/logs/log-params";
import { SystemLogView } from "@/features/admin/logs/system-log-view";

type AdminLogsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<LogSearchParams>;
};

export default async function AdminLogsPage({ params, searchParams }: AdminLogsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <SystemLogView locale={locale} params={await searchParams} />;
}
