import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketTemplateCreate } from "@/features/ticket-template/ui/ticket-template-create";

type NewTicketTemplatePageProps = { params: Promise<{ locale: string }> };

export default async function NewTicketTemplatePage({ params }: NewTicketTemplatePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <PermissionGate permission="template:write">
      <TicketTemplateCreate locale={locale} />
    </PermissionGate>
  );
}
