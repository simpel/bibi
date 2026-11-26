import { getEnv } from "@bibi/config";
import { getLogger } from "@bibi/logger";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { DEFAULT_CLOCK_FORMAT, DEFAULT_DATE_FORMAT } from "../../time/display-formats";
import { formatClock } from "../../time/format-clock";
import { formatDate } from "../../time/format-date";
import { FALLBACK_TIME_ZONE } from "../../time/time-zone";
import { toPageDto } from "../booking-page/operations";
import { getReservationMailer, type ReservationMailKind } from "./mail-port";
import { loadRoom } from "./room-day";

type Ctx = { context: Pick<OperationContext, "db" | "organizationId"> };

/** The guest's links (ADR 0119): manage by token, book again on the room's page. */
export function guestUrls({
  locale,
  token,
  pageSlug,
  roomSlug,
}: {
  locale: "sv" | "en";
  token: string;
  pageSlug: string | null;
  roomSlug: string | null;
}) {
  const origin = getEnv().WEB_ORIGIN;
  return {
    manageUrl: `${origin}/${locale}/book/manage/${token}`,
    bookUrl: pageSlug && roomSlug ? `${origin}/${locale}/book/${pageSlug}/${roomSlug}` : origin,
  };
}

/**
 * Sends one mail about a reservation to its booker, after the commit (ADR 0058, 0119). No email,
 * no mailer or an erased booker means no mail; a failed send is logged, never a failed booking.
 */
export async function mailGuest({
  context,
  reservationId,
  kind,
}: Ctx & { reservationId: string; kind: ReservationMailKind }): Promise<Result<true>> {
  const mailer = getReservationMailer();
  const row = await context.db.reservation.findFirst({
    where: { id: reservationId },
    select: {
      ...{ roomItemId: true, startsAt: true, partySize: true, publicToken: true },
      ...{ bookerName: true, bookerEmail: true, note: true, locale: true },
      room: { select: { name: true, diningRoom: { select: { slug: true } } } },
    },
  });
  if (!mailer || !row?.bookerEmail || !row.bookerName) return ok({ value: true });
  const [room, page] = await Promise.all([
    loadRoom({ context, roomItemId: row.roomItemId }),
    context.db.bookingPage.findFirst({}),
  ]);
  const timeZone = room.ok ? room.value.timeZone : FALLBACK_TIME_ZONE;
  const locale = row.locale === "en" ? "en" : "sv";
  const at = { locale, timeZone, instant: row.startsAt };
  const branding = toPageDto({ row: page });
  const sent = await mailer({
    kind,
    locale,
    to: row.bookerEmail,
    restaurant: {
      name: row.room.name,
      ...(branding.accentColor ? { accentColor: branding.accentColor } : {}),
      ...(branding.contactPhone ? { phone: branding.contactPhone } : {}),
      ...(branding.contactEmail ? { email: branding.contactEmail } : {}),
      ...(branding.policy[locale] ? { policy: branding.policy[locale] } : {}),
      ...(branding.logoKey && branding.slug
        ? { logoUrl: `${getEnv().WEB_ORIGIN}/book/${branding.slug}/logo` }
        : {}),
    },
    reservation: {
      dateLabel: formatDate({ ...at, dateFormat: DEFAULT_DATE_FORMAT, weekday: "long" }),
      timeLabel: formatClock({ ...at, clockFormat: DEFAULT_CLOCK_FORMAT }),
      partySize: row.partySize,
      bookerName: row.bookerName,
      ...(row.note ? { note: row.note } : {}),
    },
    ...guestUrls({
      locale,
      token: row.publicToken,
      pageSlug: branding.slug,
      roomSlug: row.room.diningRoom?.slug ?? null,
    }),
  });
  if (!sent.ok) getLogger().warn({ event: "reservation.mailFailed", kind, reservationId });
  return ok({ value: true });
}
