import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { TicketStatusList } from "@/features/ticket-status/ui/ticket-status-list";

type TicketStatusesPageProps = { params: Promise<{ locale: string }> };

export default async function TicketStatusesPage({ params }: TicketStatusesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <TicketStatusList locale={locale} />;
}
