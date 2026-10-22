import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketTemplateUpdate } from "@/features/ticket-template/ui/ticket-template-update";

type UpdateTicketTemplatePageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateTicketTemplatePage({ params }: UpdateTicketTemplatePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <PermissionGate permission="template:write">
      <TicketTemplateUpdate locale={locale} id={id} />
    </PermissionGate>
  );
}
