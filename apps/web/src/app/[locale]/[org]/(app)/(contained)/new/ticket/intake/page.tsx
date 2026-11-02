import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketIntake } from "@/features/ticket/ui/ticket-intake";

type TicketIntakePageProps = { params: Promise<{ locale: string }> };

export default async function TicketIntakePage({ params }: TicketIntakePageProps) {
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
