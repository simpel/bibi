"use server";

import {
  connectIntegration,
  disconnectIntegration,
  type IntegrationConnectionDto,
  type IntegrationConnectOutput,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export async function connectFortnoxAction(): Promise<ActionResult<IntegrationConnectOutput>> {
  return toActionResult({
    result: await runOperation({ operation: connectIntegration, input: { provider: "FORTNOX" } }),
  });
}

export async function disconnectFortnoxAction(): Promise<ActionResult<IntegrationConnectionDto>> {
  return toActionResult({
    result: await runOperation({
      operation: disconnectIntegration,
      input: { provider: "FORTNOX" },
    }),
  });
}
