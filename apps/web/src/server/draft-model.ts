import "server-only";
import { getEnv } from "@bibi/config";
import { isAiFeatureConfigured } from "@bibi/core";
import { shouldUseMockModel } from "./mock-model-policy";

/**
 * Drafting a ticket from a message has a model (ADR 0084): the intake's paste dialog and the sidebar's
 * "From a message" show only then. The scripted E2E model needs no row.
 */
export async function hasDraftModel(): Promise<boolean> {
  const { E2E_MOCK_MODEL, NODE_ENV } = getEnv();
  if (shouldUseMockModel({ flag: E2E_MOCK_MODEL, nodeEnv: NODE_ENV })) return true;
  return isAiFeatureConfigured({ feature: "ticket.intakeDraft" });
}
