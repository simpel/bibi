"use server";

import {
  type AccountingSettingsDto,
  type AccountingSettingsUpdateInput,
  updateAccountingSettings,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type UpdateAccountingSettingsActionInput = { input: AccountingSettingsUpdateInput };

/** `/admin/accounting`: the accounts and the revenue accounts (ADR 0077). */
export async function updateAccountingSettingsAction({
  input,
}: UpdateAccountingSettingsActionInput): Promise<ActionResult<AccountingSettingsDto>> {
  return toActionResult({
    result: await runOperation({ operation: updateAccountingSettings, input }),
  });
}
