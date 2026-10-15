/**
 * Inbound address scheme (ADR 0012): every booking has its own address on the inbound subdomain,
 * `booking-<bookingId>@<domain>`. Booking ids are random cuid2 strings, so an address cannot be
 * guessed from another one, and the id alone resolves the organization.
 */
const PREFIX = "booking-";

/** Lowercase letters and digits only: the cuid2 alphabet. */
const ID_PATTERN = /^[a-z0-9]{1,64}$/;

export type BookingInboundAddressInput = { bookingId: string; domain: string };

/** The address a customer replies to so the mail lands on this booking. */
export function bookingInboundAddress({ bookingId, domain }: BookingInboundAddressInput): string {
  return `${PREFIX}${bookingId}@${domain.toLowerCase()}`;
}

export type BookingReplyAddressInput = { bookingId: string; domain: string | undefined };

/**
 * The booking's reply address, or null when no inbound domain is configured (`MAIL_INBOUND_DOMAIN`
 * unset): carried as `Booking.inboundAddress` and used as reply-to on booking mail.
 */
export function bookingReplyAddress({
  bookingId,
  domain,
}: BookingReplyAddressInput): string | null {
  return domain ? bookingInboundAddress({ bookingId, domain }) : null;
}

/** `Name <a@b>` → `a@b`; a bare address is returned trimmed. */
export function bareAddress({ address }: { address: string }): string {
  const angled = /<([^<>]+)>/.exec(address);
  return (angled?.[1] ?? address).trim();
}

export type BookingIdFromAddressInput = { address: string; domain: string };

/** The booking id of an inbound address on `domain`, or null for any other address. */
export function bookingIdFromAddress({
  address,
  domain,
}: BookingIdFromAddressInput): string | null {
  const bare = bareAddress({ address }).toLowerCase();
  const at = bare.lastIndexOf("@");
  if (at < 0 || bare.slice(at + 1) !== domain.toLowerCase()) return null;
  const local = bare.slice(0, at);
  if (!local.startsWith(PREFIX)) return null;
  const id = local.slice(PREFIX.length);
  return ID_PATTERN.test(id) ? id : null;
}
