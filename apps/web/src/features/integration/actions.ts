"use server";

import {
  connectIntegration,
  disconnectIntegration,
  type IntegrationConnectInput,
  type IntegrationConnectionDto,
  type IntegrationConnectOutput,
  type IntegrationProvider,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type ConnectIntegrationActionInput = { input: IntegrationConnectInput };

/** OAuth: the consent page to open; credentials: connected at once (ADR 0087, 0100). */
export async function connectIntegrationAction({
  input,
}: ConnectIntegrationActionInput): Promise<ActionResult<IntegrationConnectOutput>> {
  return toActionResult({ result: await runOperation({ operation: connectIntegration, input }) });
}

export type DisconnectIntegrationActionInput = { provider: IntegrationProvider };

export async function disconnectIntegrationAction({
  provider,
}: DisconnectIntegrationActionInput): Promise<ActionResult<IntegrationConnectionDto>> {
  return toActionResult({
    result: await runOperation({ operation: disconnectIntegration, input: { provider } }),
  });
}
