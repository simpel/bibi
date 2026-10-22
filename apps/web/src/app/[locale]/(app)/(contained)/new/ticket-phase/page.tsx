import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketPhaseCreate } from "@/features/ticket-phase/ui/ticket-phase-create";

type NewTicketPhasePageProps = { params: Promise<{ locale: string }> };

export default async function NewTicketPhasePage({ params }: NewTicketPhasePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <PermissionGate permission="pipeline:write">
      <TicketPhaseCreate />
    </PermissionGate>
  );
}
