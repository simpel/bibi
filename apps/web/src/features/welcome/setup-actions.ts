"use server";

import {
  activatePipelineSetup,
  createVenue,
  type OrganizationProfileDto,
  type PipelineSetupDraft,
  setOrganizationSetupStatus,
  type VenueCreateInput,
  type VenueDto,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/**
 * Review → Activate (ADR 0061): saves the baseline through `pipelineSetup.activate` and then
 * marks the setup COMPLETED. A failed activation leaves the setup PENDING.
 */
export async function activateSetupAction({
  draft,
}: {
  draft: PipelineSetupDraft;
}): Promise<ActionResult<OrganizationProfileDto>> {
  const activated = await runOperation({ operation: activatePipelineSetup, input: draft });
  if (!activated.ok) return toActionResult({ result: activated });
  const result = await runOperation({
    operation: setOrganizationSetupStatus,
    input: { setupStatus: "COMPLETED" },
  });
  return toActionResult({ result });
}

/** "Skip for now": the setup can be done later in Settings or with the assistant. */
export async function skipSetupAction(): Promise<ActionResult<OrganizationProfileDto>> {
  const result = await runOperation({
    operation: setOrganizationSetupStatus,
    input: { setupStatus: "SKIPPED" },
  });
  return toActionResult({ result });
}

/** "This address is also our first venue" on the organization step. */
export async function createFirstVenueAction({
  input,
}: {
  input: VenueCreateInput;
}): Promise<ActionResult<VenueDto>> {
  return toActionResult({ result: await runOperation({ operation: createVenue, input }) });
}
