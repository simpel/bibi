import { resolveLocale } from "@bibi/i18n";
import { dayRoute } from "@/features/reservation/lib/routes";
import { dayOf } from "@/features/table-booking/lib/edge-time";
import { redirect } from "@/lib/navigation";
import { loadOrganizationTimeZone } from "@/server/time-zones";

type PageProps = {
  params: Promise<{ locale: string; org: string }>;
  searchParams: Promise<{ room?: string; create?: string }>;
};

/** `/reservations` opens today in the organization's zone; the day is in the path (ADR 0064). */
export default async function ReservationsPage({ params, searchParams }: PageProps) {
  const { locale, org } = await params;
  const { room, create } = await searchParams;
  const timeZone = await loadOrganizationTimeZone();
  const date = dayOf({ instant: new Date(), timeZone });
  const href = dayRoute({ date, room });
  // The create menu opens today with the create sheet open (`?create=1`).
  const open = create === "1" ? `${href}${href.includes("?") ? "&" : "?"}create=1` : href;
  redirect({ href: open, locale: resolveLocale({ value: locale }), org });
}
