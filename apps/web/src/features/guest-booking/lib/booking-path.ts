import { LOCALES } from "@bibi/i18n";

/** What pins a booking page's organization: the page slug or a reservation's manage token. */
export type BookingPathPin = { slug: string } | { token: string };

const SEGMENT = /^[^/]+$/;

/** `/<locale>/book/<slug>[/…]` → the slug, `/<locale>/book/manage/<token>` → the token, else null. */
export function bookingPinOfPath({ pathname }: { pathname: string }): BookingPathPin | null {
  const [, locale, book, first, second] = pathname.split("/");
  if (!locale || !(LOCALES as readonly string[]).includes(locale) || book !== "book") return null;
  if (!first || !SEGMENT.test(first)) return null;
  if (first === "manage") return second ? { token: decodeURIComponent(second) } : null;
  return { slug: decodeURIComponent(first) };
}
