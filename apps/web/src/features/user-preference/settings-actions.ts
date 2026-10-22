"use server";

import {
  type OrganizationProfileDto,
  type SetupStatus,
  setOrganizationSetupStatus,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SetSetupStatusInput = { setupStatus: SetupStatus };

/** Saves where the active organization is in its first setup (ADR 0061): start, finish or skip. */
export async function setSetupStatus({
  setupStatus,
}: SetSetupStatusInput): Promise<ActionResult<OrganizationProfileDto>> {
  const result = await runOperation({
    operation: setOrganizationSetupStatus,
    input: { setupStatus },
  });
  return toActionResult({ result });
}
