import "server-only";
import {
  publicAvailability,
  publicBookingPage,
  publicGetReservation,
  type Result,
} from "@bibi/core";
import type { PublicBookingPageDto, PublicReservationDto } from "@bibi/core/schemas";
import { cache } from "react";
import type { GuestPin } from "./guest-pin";
import { runGuestOperation } from "./run-guest-operation";

/** A guest read's value; NOT_FOUND is null, anything else is thrown to the error page. */
function valueOrNull<T>({ result }: { result: Result<T> }): T | null {
  if (result.ok) return result.value;
  if (result.error.code === "NOT_FOUND") return null;
  throw result.error;
}

const pageBySlug = cache(async (slug: string) =>
  valueOrNull({
    result: await runGuestOperation({
      pin: { slug },
      operation: publicBookingPage,
      input: { slug },
    }),
  }),
);

/** The published booking page by its slug, once per request (metadata and page share it). */
export function loadBookingPage({ slug }: { slug: string }): Promise<PublicBookingPageDto | null> {
  return pageBySlug(slug);
}

const reservationByToken = cache(async (token: string) =>
  valueOrNull({
    result: await runGuestOperation({
      pin: { token },
      operation: publicGetReservation,
      input: { token },
    }),
  }),
);

/** The guest's reservation by its manage token, once per request. */
export function loadReservation({
  token,
}: {
  token: string;
}): Promise<PublicReservationDto | null> {
  return reservationByToken(token);
}

const pageOfToken = cache(async (token: string, slug: string) =>
  valueOrNull({
    result: await runGuestOperation({
      pin: { token },
      operation: publicBookingPage,
      input: { slug },
    }),
  }),
);

export type LoadPageOfReservationInput = { token: string; slug: string | null };

/** The booking page of a reservation's organization (branding, contact), pinned by the token. */
export async function loadPageOfReservation({
  token,
  slug,
}: LoadPageOfReservationInput): Promise<PublicBookingPageDto | null> {
  return slug ? pageOfToken(token, slug) : null;
}

export type LoadSlotsInput = {
  pin: GuestPin;
  slug: string;
  roomSlug: string;
  date: string;
  partySize: number;
  /** A guest moving their own booking: it does not count against the times. */
  token?: string;
};

/** The times a party can book on a day, with the room's zone; null for an unknown room. */
export async function loadSlots({ pin, slug, roomSlug, date, partySize, token }: LoadSlotsInput) {
  const result = await runGuestOperation({
    pin,
    operation: publicAvailability,
    input: { slug, roomSlug, date, partySize, ...(token ? { token } : {}) },
  });
  return valueOrNull({ result });
}
