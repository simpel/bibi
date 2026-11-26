import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadReservation } from "@/features/reservation/load-reservation";
import { ReservationDetail } from "@/features/reservation/ui/reservation-detail";
import { entityTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const found = await loadReservation({ id });
  return entityTitle({
    name: found.ok ? (found.value.bookerName ?? null) : null,
    fallback: "Reservation",
  });
}

export default async function ReservationPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <ReservationDetail locale={locale} id={id} />;
}
