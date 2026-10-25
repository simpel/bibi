"use server";

import { type UserSettingsDto, type UserSettingsUpdateInput, updateUserSettings } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SaveUserSettingsInput = UserSettingsUpdateInput;

/** Saves the signed-in user's own display formats (ADR 0046); `null` resets one to the default. */
export async function saveUserSettings({
  dateFormat,
  clockFormat,
  numberFormat,
  currencyDisplay,
}: SaveUserSettingsInput): Promise<ActionResult<UserSettingsDto>> {
  const result = await runOperation({
    operation: updateUserSettings,
    input: { dateFormat, clockFormat, numberFormat, currencyDisplay },
  });
  return toActionResult({ result });
}
