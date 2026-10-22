"use server";

import { type UserSettingsDto, type UserSettingsUpdateInput, updateUserSettings } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SetOnboardingStatusInput = UserSettingsUpdateInput;

/** Saves where the signed-in user is in the first setup (ADR 0046): start, finish or skip. */
export async function setOnboardingStatus({
  onboardingStatus,
}: SetOnboardingStatusInput): Promise<ActionResult<UserSettingsDto>> {
  const result = await runOperation({ operation: updateUserSettings, input: { onboardingStatus } });
  return toActionResult({ result });
}
