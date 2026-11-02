import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TicketIntake } from "@/features/ticket/ui/ticket-intake";

type NewTicketPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ fromMessage?: string | string[] }>;
};

/** `/new/ticket`: the one-page ticket intake (ADR 0081), `?fromMessage=<id>` from the inbox. */
export default async function NewTicketPage({ params, searchParams }: NewTicketPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { fromMessage } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="ticket:write">
        <TicketIntake
          locale={locale}
          fromMessage={typeof fromMessage === "string" ? fromMessage : undefined}
        />
      </PermissionGate>
    </SimplePage>
  );
}
