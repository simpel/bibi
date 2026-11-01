import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { TicketDetail } from "@/features/ticket/ui/ticket-detail";

type TicketPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function TicketPage({ params }: TicketPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <TicketDetail locale={locale} id={id} />
    </SimplePage>
  );
}
