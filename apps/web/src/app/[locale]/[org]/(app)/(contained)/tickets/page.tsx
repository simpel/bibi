import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { readTicketListParams, type TicketSearchParams } from "@/features/ticket/lib/list-params";
import { TicketList } from "@/features/ticket/ui/ticket-list";

type TicketsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<TicketSearchParams>;
};

export default async function TicketsPage({ params, searchParams }: TicketsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <TicketList locale={locale} params={readTicketListParams({ params: await searchParams })} />
    </SimplePage>
  );
}
