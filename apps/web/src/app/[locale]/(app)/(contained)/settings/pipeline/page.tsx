import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { TicketPhaseList } from "@/features/ticket-phase/ui/ticket-phase-list";

type TicketPhasesPageProps = { params: Promise<{ locale: string }> };

export default async function TicketPhasesPage({ params }: TicketPhasesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <TicketPhaseList locale={locale} />;
}
