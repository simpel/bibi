import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { TicketTemplateList } from "@/features/ticket-template/ui/ticket-template-list";

type TicketTemplatesPageProps = { params: Promise<{ locale: string }> };

export default async function TicketTemplatesPage({ params }: TicketTemplatesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <TicketTemplateList locale={locale} />
    </SimplePage>
  );
}
