"use server";

import type {
  BillingConfigDto,
  BillingConfigUpdateInput,
  BillingOrganizationDto,
  BillingOrganizationUpdateInput,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { toActionResult } from "@/server/to-action-result";

export type UpdateBillingConfigActionInput = { input: BillingConfigUpdateInput };

/** Stores the Stripe key and sets Bibi up in that account (ADR 0095 §1–2). Superadmins only. */
export async function updateBillingConfigAction({
  input,
}: UpdateBillingConfigActionInput): Promise<ActionResult<BillingConfigDto>> {
  const operation = platformOperations().updateBillingConfig;
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
