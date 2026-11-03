"use server";

import type {
  BillingConfigDto,
  BillingConfigProvisionInput,
  BillingConfigUpdateInput,
  BillingOrganizationDto,
  BillingOrganizationUpdateInput,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { toActionResult } from "@/server/to-action-result";

export type UpdateBillingConfigActionInput = { input: BillingConfigUpdateInput };

/** Stores the Stripe key, the webhook secret and the price ids (ADR 0095 §1). Superadmins only. */
export async function updateBillingConfigAction({
  input,
}: UpdateBillingConfigActionInput): Promise<ActionResult<BillingConfigDto>> {
  const operation = platformOperations().updateBillingConfig;
  return toActionResult({ result: await runPlatformOperation({ operation, input }) });
}

export type ProvisionBillingConfigActionInput = { input: BillingConfigProvisionInput };

/** "Create in Stripe": product, prices, portal and (with a URL) the webhook (ADR 0095 §2). */
export async function provisionBillingConfigAction({
  input,
}: ProvisionBillingConfigActionInput): Promise<ActionResult<BillingConfigDto>> {
  const operation = platformOperations().provisionBillingConfig;
  return toActionResult({ result: await runPlatformOperation({ operation, input }) });
}

export type UpdateBillingOrganizationActionInput = { input: BillingOrganizationUpdateInput };

/** Exempts an organization or moves its trial end (ADR 0095 §4). */
export async function updateBillingOrganizationAction({
  input,
}: UpdateBillingOrganizationActionInput): Promise<ActionResult<BillingOrganizationDto>> {
  const operation = platformOperations().updateBillingOrganization;
  return toActionResult({ result: await runPlatformOperation({ operation, input }) });
}
