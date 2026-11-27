import { resolveLocale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { bookingMetadata } from "@/features/guest-booking/server/booking-metadata";
import { loadBookingPage } from "@/features/guest-booking/server/load-guest-booking";
import { BookingIntro } from "@/features/guest-booking/ui/booking-intro";
import { BookingShell } from "@/features/guest-booking/ui/booking-shell";
import { RoomList } from "@/features/guest-booking/ui/room-list";
import { redirect } from "@/lib/navigation";

type BookPageProps = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BookPageProps) {
  const { locale, slug } = await params;
  return bookingMetadata({ locale, page: await loadBookingPage({ slug }) });
}

/** A venue's booking page (ADR 0119): its dining rooms, or straight into the only one. */
export default async function BookPage({ params }: BookPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const page = await loadBookingPage({ slug });
  if (!page) notFound();
  const [only] = page.rooms;
  if (page.rooms.length === 1 && only) {
    redirect({ href: `/book/${page.slug}/${only.slug}`, locale });
  }
  const t = await getTranslations("guestBooking.rooms");
  return (
    <BookingShell page={page} title={t("title")}>
      <div className="flex flex-col gap-6">
        <BookingIntro page={page} locale={locale} />
        <RoomList page={page} />
      </div>
    </BookingShell>
  );
}
