"use server";

import { type ProfileDto, type ProfileSetLocaleInput, setProfileLocale } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SaveProfileLocaleInput = ProfileSetLocaleInput;

/** Saves the signed-in user's preferred locale on their profile (ADR 0061). */
export async function saveProfileLocale({
  locale,
}: SaveProfileLocaleInput): Promise<ActionResult<ProfileDto>> {
  const result = await runOperation({
    operation: setProfileLocale,
    input: { locale },
  });
  return toActionResult({ result });
}
