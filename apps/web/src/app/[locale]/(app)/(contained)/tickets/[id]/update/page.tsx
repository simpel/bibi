import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { TicketUpdate } from "@/features/ticket/ui/ticket-update";

type UpdateTicketPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateTicketPage({ params }: UpdateTicketPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <TicketUpdate locale={locale} id={id} />;
}
