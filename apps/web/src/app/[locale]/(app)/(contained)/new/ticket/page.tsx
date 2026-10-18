import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { TicketCreate } from "@/features/ticket/ui/ticket-create";

type NewTicketPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function NewTicketPage({ params, searchParams }: NewTicketPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <TicketCreate locale={locale} custom={(await searchParams).mode === "custom"} />;
}
