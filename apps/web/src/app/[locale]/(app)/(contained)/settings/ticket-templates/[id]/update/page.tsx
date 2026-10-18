import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { TicketTemplateUpdate } from "@/features/ticket-template/ui/ticket-template-update";

type UpdateTicketTemplatePageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateTicketTemplatePage({ params }: UpdateTicketTemplatePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <TicketTemplateUpdate locale={locale} id={id} />;
}
