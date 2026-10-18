import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { TicketDetail } from "@/features/ticket/ui/ticket-detail";

type TicketPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function TicketPage({ params }: TicketPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <TicketDetail locale={locale} id={id} />;
}
