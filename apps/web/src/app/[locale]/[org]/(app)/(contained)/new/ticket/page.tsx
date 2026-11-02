import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketIntake } from "@/features/ticket/ui/ticket-intake";

type NewTicketPageProps = { params: Promise<{ locale: string }> };

/** `/new/ticket`: the one-page ticket intake (ADR 0081). */
export default async function NewTicketPage({ params }: NewTicketPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="ticket:write">
        <TicketIntake locale={locale} />
      </PermissionGate>
    </SimplePage>
  );
}
