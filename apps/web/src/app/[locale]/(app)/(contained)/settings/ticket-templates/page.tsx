import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { TicketTemplateList } from "@/features/ticket-template/ui/ticket-template-list";

type TicketTemplatesPageProps = { params: Promise<{ locale: string }> };

export default async function TicketTemplatesPage({ params }: TicketTemplatesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <TicketTemplateList locale={locale} />;
}
