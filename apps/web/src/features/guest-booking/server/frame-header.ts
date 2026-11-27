import { getBookingPage, runGuest } from "@bibi/core";
import type { BookingPageDto } from "@bibi/core/schemas";
import { getLogger } from "@bibi/logger";
import { bookingPinOfPath } from "../lib/booking-path";
import { frameAncestors } from "../lib/frame-ancestors";
import { type GuestPin, organizationOfPin } from "./guest-pin";

const TTL_MS = 60_000;
const MAX_ENTRIES = 500;

// Per process: the proxy sees every navigation of a booking flow, so one read a minute per page.
const holder = globalThis as typeof globalThis & {
  __bibiFrameOrigins?: Map<string, { origins: string[]; until: number }>;
};

async function readOrigins({ pin }: { pin: GuestPin }): Promise<string[]> {
  const organizationId = await organizationOfPin({ pin });
  if (!organizationId) return [];
  const result = await runGuest({ organizationId, operation: getBookingPage, input: {} });
  return result.ok ? (result.value as BookingPageDto).embedOrigins : [];
}

async function embedOrigins({ pin }: { pin: GuestPin }): Promise<string[]> {
  holder.__bibiFrameOrigins ??= new Map();
  const cache = holder.__bibiFrameOrigins;
  const key = "slug" in pin ? `s:${pin.slug}` : `t:${pin.token}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.origins;
  const origins = await readOrigins({ pin });
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(key, { origins, until: Date.now() + TTL_MS });
  return origins;
}

/**
 * The `Content-Security-Policy` of a booking page (ADR 0119): `frame-ancestors` with the sites
 * the organization allows to embed it. Null for any other path; on a failed read only 'self'.
 */
export async function bookingFrameHeader({ pathname }: { pathname: string }) {
  const pin = bookingPinOfPath({ pathname });
  if (!pin) return null;
  try {
    return frameAncestors({ origins: await embedOrigins({ pin }) });
  } catch (error) {
    getLogger().warn({ event: "guestBooking.frameOriginsFailed", err: error });
    return frameAncestors({ origins: [] });
  }
}
