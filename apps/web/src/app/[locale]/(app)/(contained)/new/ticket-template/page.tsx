import { resolveLocale } from "@okazi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TicketTemplateCreate } from "@/features/ticket-template/ui/ticket-template-create";
import { getCallerAbilities } from "@/server/caller-abilities";

type NewTicketTemplatePageProps = { params: Promise<{ locale: string }> };

export default async function NewTicketTemplatePage({ params }: NewTicketTemplatePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  if (!(await getCallerAbilities()).ticketTemplateAdmin) notFound();
  return <TicketTemplateCreate locale={locale} />;
}
