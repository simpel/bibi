import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { TicketPhaseUpdate } from "@/features/ticket-phase/ui/ticket-phase-update";

type UpdateTicketPhasePageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateTicketPhasePage({ params }: UpdateTicketPhasePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <TicketPhaseUpdate locale={locale} id={id} />;
}
