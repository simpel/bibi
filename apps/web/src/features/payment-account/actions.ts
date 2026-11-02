"use server";

import {
  type PaymentAccountDto,
  type PaymentAccountOnboardingDto,
  type PaymentSettingsDto,
  type PaymentSettingsUpdateInput,
  startPaymentOnboarding,
  syncPaymentAccount,
  updatePaymentSettings,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export async function startPaymentOnboardingAction(): Promise<
  ActionResult<PaymentAccountOnboardingDto>
> {
  return toActionResult({
    result: await runOperation({ operation: startPaymentOnboarding, input: {} }),
  });
}

export async function syncPaymentAccountAction(): Promise<ActionResult<PaymentAccountDto>> {
  return toActionResult({
    result: await runOperation({ operation: syncPaymentAccount, input: {} }),
  });
}

export type UpdatePaymentSettingsActionInput = { input: PaymentSettingsUpdateInput };

/** `/settings/payments`: the deposit rule and the invoice provider (ADR 0090). */
export async function updatePaymentSettingsAction({
  input,
}: UpdatePaymentSettingsActionInput): Promise<ActionResult<PaymentSettingsDto>> {
  return toActionResult({
    result: await runOperation({ operation: updatePaymentSettings, input }),
  });
}
