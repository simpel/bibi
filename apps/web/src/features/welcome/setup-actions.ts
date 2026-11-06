"use server";

import {
  activatePipelineSetup,
  createExamplesPipelineSetup,
  createVenue,
  type OrganizationProfileDto,
  type PipelineCreateExamplesInput,
  type PipelineSetupDraft,
  setOrganizationSetupStatus,
  type VenueCreateInput,
  type VenueDto,
} from "@bibi/core";
import { getLogger } from "@bibi/logger";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type ActivateSetupInput = {
  draft: PipelineSetupDraft;
  /** The example orders for the board, in the user's language (`welcome.examples`). */
  examples: PipelineCreateExamplesInput;
};

/**
 * Review → Activate (ADR 0061): saves the baseline through `pipelineSetup.activate`, marks the
 * setup COMPLETED, then creates the example orders. A failed activation leaves the setup
 * PENDING; failed examples are logged and the setup still counts as done.
 */
export async function activateSetupAction({
  draft,
  examples,
}: ActivateSetupInput): Promise<ActionResult<OrganizationProfileDto>> {
  const activated = await runOperation({ operation: activatePipelineSetup, input: draft });
  if (!activated.ok) return toActionResult({ result: activated });
  const result = await runOperation({
    operation: setOrganizationSetupStatus,
    input: { setupStatus: "COMPLETED" },
  });
  if (!result.ok) return toActionResult({ result });
  const created = await runOperation({ operation: createExamplesPipelineSetup, input: examples });
  if (!created.ok) {
    getLogger().warn({ event: "welcome.examplesFailed", code: created.error.code });
  }
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
