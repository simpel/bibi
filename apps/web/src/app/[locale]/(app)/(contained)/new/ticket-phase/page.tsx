import { resolveLocale } from "@okazi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TicketPhaseCreate } from "@/features/ticket-phase/ui/ticket-phase-create";
import { getCallerAbilities } from "@/server/caller-abilities";

type NewTicketPhasePageProps = { params: Promise<{ locale: string }> };

export default async function NewTicketPhasePage({ params }: NewTicketPhasePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  if (!(await getCallerAbilities()).ticketPhaseAdmin) notFound();
  return <TicketPhaseCreate />;
}
