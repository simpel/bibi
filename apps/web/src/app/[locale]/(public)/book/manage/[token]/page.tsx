import { resolveLocale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { bookingMetadata } from "@/features/guest-booking/server/booking-metadata";
import {
  loadPageOfReservation,
  loadReservation,
} from "@/features/guest-booking/server/load-guest-booking";
import { prepareChange } from "@/features/guest-booking/server/prepare-change";
import { ManageReservation } from "@/features/guest-booking/ui/manage-reservation";

type ManagePageProps = {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ booked?: string; change?: string; party?: string; date?: string }>;
};

export const dynamic = "force-dynamic";

/** The URL is the guest's key: never indexed, no Referer (ADR 0119). */
export async function generateMetadata({ params }: ManagePageProps) {
  const { locale, token } = await params;
  const reservation = await loadReservation({ token });
  const page = reservation
    ? await loadPageOfReservation({ token, slug: reservation.pageSlug })
    : null;
  return bookingMetadata({ locale, page, manage: true });
}

/** A guest's booking, by its manage token (ADR 0119): see it, move it, edit it or cancel it. */
export default async function ManagePage({ params, searchParams }: ManagePageProps) {
  const { locale: rawLocale, token } = await params;
  setRequestLocale(resolveLocale({ value: rawLocale }));
  const query = await searchParams;
  const reservation = await loadReservation({ token });
  if (!reservation) notFound();
  const page = await loadPageOfReservation({ token, slug: reservation.pageSlug });
  const change =
    query.change === "1" ? await prepareChange({ token, reservation, page, query }) : null;
  return (
    <ManageReservation
      token={token}
      reservation={reservation}
      page={page}
      booked={query.booked === "1"}
      change={change}
    />
  );
}
