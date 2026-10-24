import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketStatusCreate } from "@/features/ticket-status/ui/ticket-status-create";

type NewTicketStatusPageProps = { params: Promise<{ locale: string }> };

export default async function NewTicketStatusPage({ params }: NewTicketStatusPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <PermissionGate permission="pipeline:write">
      <TicketStatusCreate />
    </PermissionGate>
  );
}
