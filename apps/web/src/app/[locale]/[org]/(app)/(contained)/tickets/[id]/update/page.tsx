import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketUpdate } from "@/features/ticket/ui/ticket-update";

type UpdateTicketPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateTicketPage({ params }: UpdateTicketPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="ticket:write">
        <TicketUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
