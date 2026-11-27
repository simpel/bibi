"use server";

import {
  publicCancelReservation,
  publicChangeReservation,
  publicCreateReservation,
  type Result,
} from "@bibi/core";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { toActionResult } from "@/server/to-action-result";
import { runGuestOperation } from "./server/run-guest-operation";
import { checkCaptcha } from "./server/turnstile";

export type CreateGuestReservationInput = {
  slug: string;
  roomSlug: string;
  startsAt: string;
  partySize: number;
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  note?: string | null;
  /** Counts per list value; only values above 0. */
  requirements?: { vocabularyValueId: string; quantity: number }[];
  locale: "sv" | "en";
  /** The Turnstile widget's token; ignored when no captcha is configured. */
  captcha?: string;
};

/** The client's address for Turnstile: first hop of `x-forwarded-for`, else `x-real-ip`. */
async function clientIp(): Promise<string | null> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || null;
}

const done = <T>({ result }: { result: Result<T> }): ActionResult<true> =>
  toActionResult({ result: result.ok ? { ok: true, value: true as const } : result });

/** The booking page's create step (ADR 0119): captcha first, then the guest's booking. */
export async function createGuestReservationAction({
  captcha,
  ...input
}: CreateGuestReservationInput): Promise<ActionResult<{ token: string }>> {
  const passed = await checkCaptcha({ token: captcha, ip: await clientIp() });
  if (!passed.ok) return toActionResult({ result: passed });
  const result = await runGuestOperation({
    pin: { slug: input.slug },
    operation: publicCreateReservation,
    input: { ...input, source: "WEB" },
  });
  return toActionResult({
    result: result.ok ? { ok: true, value: { token: result.value.token } } : result,
  });
}

export type ChangeGuestReservationInput = {
  token: string;
  startsAt?: string;
  partySize?: number;
  bookerName?: string;
  bookerPhone?: string;
  bookerEmail?: string;
  note?: string | null;
};

/** The manage page: a new time or party, or edited details, before the change cutoff. */
export async function changeGuestReservationAction({
  token,
  ...change
}: ChangeGuestReservationInput): Promise<ActionResult<true>> {
  const result = await runGuestOperation({
    pin: { token },
    operation: publicChangeReservation,
    input: { token, ...change },
  });
  return done({ result });
}

/** The manage page: the guest cancels before the change cutoff. */
export async function cancelGuestReservationAction({
  token,
}: {
  token: string;
}): Promise<ActionResult<true>> {
  const result = await runGuestOperation({
    pin: { token },
    operation: publicCancelReservation,
    input: { token },
  });
  return done({ result });
}
