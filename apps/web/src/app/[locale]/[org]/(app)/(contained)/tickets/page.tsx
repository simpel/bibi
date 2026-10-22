import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { readMine } from "@/features/assignment/ui/mine-filter";
import { TicketList } from "@/features/ticket/ui/ticket-list";
import { readCursor } from "@/lib/page-cursor";

type TicketsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[]; mine?: string | string[] }>;
};

export default async function TicketsPage({ params, searchParams }: TicketsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor, mine } = await searchParams;
  setRequestLocale(locale);
  return (
    <TicketList
      locale={locale}
      cursor={readCursor({ value: cursor })}
      mine={readMine({ value: mine })}
    />
  );
}
