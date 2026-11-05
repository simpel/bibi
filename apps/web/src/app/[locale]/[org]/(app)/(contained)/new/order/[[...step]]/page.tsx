import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { isPasteSegments, stepFromSegments } from "@/features/order/intake/intake-path";
import { OrderIntake } from "@/features/order/ui/order-intake";
import { ORDER_FROM_MESSAGE_ROUTE } from "@/lib/inbox-routes";
import { redirect } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";

type NewOrderPageProps = {
  params: Promise<{ locale: string; org: string; step?: string[] }>;
  searchParams: Promise<{ fromMessage?: string | string[]; start?: string | string[] }>;
};

export async function generateMetadata({ params }: NewOrderPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "orderIntake", key: "title" });
}

/**
 * `/new/order[/<step>]`: the one-page order intake (ADR 0081) with its open step in the path,
 * `?fromMessage=<id>` from the inbox. `/new/order/message` is step 1 with the paste dialog open
 * (ADR 0084); the older `?start=message` redirects there.
 */
export default async function NewOrderPage({ params, searchParams }: NewOrderPageProps) {
  const { org, step: segments, ...rest } = await params;
  const locale = resolveLocale({ value: rest.locale });
  const { fromMessage, start } = await searchParams;
  setRequestLocale(locale);
  const step = isPasteSegments({ segments }) ? "who" : stepFromSegments({ segments });
  if (!step) notFound();
  const messageId = typeof fromMessage === "string" ? fromMessage : undefined;
  if (start === "message") {
    const query = messageId ? `?fromMessage=${encodeURIComponent(messageId)}` : "";
    redirect({ href: `${ORDER_FROM_MESSAGE_ROUTE}${query}`, locale, org });
  }
  return (
    <SimplePage>
      <PermissionGate permission="order:write">
        <OrderIntake locale={locale} fromMessage={messageId} step={step} />
      </PermissionGate>
    </SimplePage>
  );
}
