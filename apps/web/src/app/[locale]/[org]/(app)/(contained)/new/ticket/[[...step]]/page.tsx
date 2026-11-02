import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { isPasteSegments, stepFromSegments } from "@/features/ticket/intake/intake-path";
import { TicketIntake } from "@/features/ticket/ui/ticket-intake";
import { TICKET_FROM_MESSAGE_ROUTE } from "@/lib/inbox-routes";
import { redirect } from "@/lib/navigation";

type NewTicketPageProps = {
  params: Promise<{ locale: string; org: string; step?: string[] }>;
  searchParams: Promise<{ fromMessage?: string | string[]; start?: string | string[] }>;
};

/**
 * `/new/ticket[/<step>]`: the one-page ticket intake (ADR 0081) with its open step in the path,
 * `?fromMessage=<id>` from the inbox. `/new/ticket/message` is step 1 with the paste dialog open
 * (ADR 0084); the older `?start=message` redirects there.
 */
export default async function NewTicketPage({ params, searchParams }: NewTicketPageProps) {
  const { org, step: segments, ...rest } = await params;
  const locale = resolveLocale({ value: rest.locale });
  const { fromMessage, start } = await searchParams;
  setRequestLocale(locale);
  const step = isPasteSegments({ segments }) ? "who" : stepFromSegments({ segments });
  if (!step) notFound();
  const messageId = typeof fromMessage === "string" ? fromMessage : undefined;
  if (start === "message") {
    const query = messageId ? `?fromMessage=${encodeURIComponent(messageId)}` : "";
    redirect({ href: `${TICKET_FROM_MESSAGE_ROUTE}${query}`, locale, org });
  }
  return (
    <SimplePage>
      <PermissionGate permission="ticket:write">
        <TicketIntake locale={locale} fromMessage={messageId} step={step} />
      </PermissionGate>
    </SimplePage>
  );
}
