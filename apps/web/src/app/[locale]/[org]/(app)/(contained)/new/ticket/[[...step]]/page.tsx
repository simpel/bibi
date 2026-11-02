import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { intakeStepPath, stepFromSegments } from "@/features/ticket/intake/intake-path";
import { TicketIntake } from "@/features/ticket/ui/ticket-intake";
import { redirect } from "@/lib/navigation";

type NewTicketPageProps = {
  params: Promise<{ locale: string; org: string; step?: string[] }>;
  searchParams: Promise<{ fromMessage?: string | string[]; start?: string | string[] }>;
};

/**
 * `/new/ticket[/<step>]`: the one-page ticket intake (ADR 0081) with its open step in the path,
 * `?fromMessage=<id>` from the inbox. The older `?start=message` redirects to `/message`.
 */
export default async function NewTicketPage({ params, searchParams }: NewTicketPageProps) {
  const { org, step: segments, ...rest } = await params;
  const locale = resolveLocale({ value: rest.locale });
  const { fromMessage, start } = await searchParams;
  setRequestLocale(locale);
  const step = stepFromSegments({ segments });
  if (!step) notFound();
  const messageId = typeof fromMessage === "string" ? fromMessage : undefined;
  if (start === "message") {
    const query = messageId ? `?fromMessage=${encodeURIComponent(messageId)}` : "";
    redirect({ href: `${intakeStepPath({ step: "message" })}${query}`, locale, org });
  }
  return (
    <SimplePage>
      <PermissionGate permission="ticket:write">
        <TicketIntake locale={locale} fromMessage={messageId} step={step} />
      </PermissionGate>
    </SimplePage>
  );
}
