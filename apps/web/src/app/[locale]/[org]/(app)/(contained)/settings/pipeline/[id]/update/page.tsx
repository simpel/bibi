import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketStatusUpdate } from "@/features/ticket-status/ui/ticket-status-update";

type UpdateTicketStatusPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateTicketStatusPage({ params }: UpdateTicketStatusPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="pipeline:write">
        <TicketStatusUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
