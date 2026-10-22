"use server";

import { setUserPreference, type UserPreferenceDto, type UserPreferenceSetInput } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SaveUserPreferenceInput = UserPreferenceSetInput;

/** Saves one of the signed-in user's own UI preferences (ADR 0039), e.g. a table's column order. */
export async function saveUserPreference({
  key,
  value,
}: SaveUserPreferenceInput): Promise<ActionResult<UserPreferenceDto>> {
  const result = await runOperation({ operation: setUserPreference, input: { key, value } });
  return toActionResult({ result });
}
