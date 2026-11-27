import { resolveLocale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { pickText } from "@/features/guest-booking/lib/guest-text";
import { bookingMetadata } from "@/features/guest-booking/server/booking-metadata";
import { loadBookingPage } from "@/features/guest-booking/server/load-guest-booking";
import { prepareSlots } from "@/features/guest-booking/server/prepare-slots";
import { captchaConfig } from "@/features/guest-booking/server/turnstile";
import { BookingFlow } from "@/features/guest-booking/ui/booking-flow";
import { BookingIntro } from "@/features/guest-booking/ui/booking-intro";
import { BookingShell } from "@/features/guest-booking/ui/booking-shell";

type BookRoomPageProps = {
  params: Promise<{ locale: string; slug: string; room: string }>;
  searchParams: Promise<{ party?: string; date?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BookRoomPageProps) {
  const { locale, slug } = await params;
  return bookingMetadata({ locale, page: await loadBookingPage({ slug }) });
}

/** Booking a table in one dining room (ADR 0119): party, day and time, then the guest's details. */
export default async function BookRoomPage({ params, searchParams }: BookRoomPageProps) {
  const { locale: rawLocale, slug, room: roomSlug } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const { party, date } = await searchParams;
  const page = await loadBookingPage({ slug });
  const room = page?.rooms.find((candidate) => candidate.slug === roomSlug);
  if (!page || !room) notFound();
  const slots = await prepareSlots({
    ...{ pin: { slug }, slug, roomSlug, maxParty: room.maxOnlineParty },
    ...{ partyParam: party, dateParam: date },
  });
  if (!slots) notFound();
  return (
    <BookingShell page={page} title={room.name}>
      <div className="flex flex-col gap-6">
        <BookingIntro page={page} locale={locale} />
        <BookingFlow
          {...slots}
          slug={page.slug}
          roomSlug={room.slug}
          maxParty={room.maxOnlineParty}
          contactPhone={page.contactPhone}
          policy={pickText({ texts: page.policy, locale })}
          captcha={captchaConfig()}
          needLists={page.needLists}
        />
      </div>
    </BookingShell>
  );
}
