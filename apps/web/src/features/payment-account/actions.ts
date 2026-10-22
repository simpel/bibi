"use server";

import {
  type PaymentAccountDto,
  type PaymentAccountOnboardingDto,
  startPaymentOnboarding,
  syncPaymentAccount,
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
