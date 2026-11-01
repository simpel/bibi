"use server";

import {
  type AccountingExportDto,
  type AccountingExportFileDto,
  type AccountingSettingsDto,
  type AccountingSettingsUpdateInput,
  createAccountingExport,
  downloadAccountingExport,
  updateAccountingSettings,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type UpdateAccountingSettingsActionInput = { input: AccountingSettingsUpdateInput };

/** `/settings/accounting`: the accounts, the fiscal year and the revenue accounts (ADR 0077). */
export async function updateAccountingSettingsAction({
  input,
}: UpdateAccountingSettingsActionInput): Promise<ActionResult<AccountingSettingsDto>> {
  return toActionResult({
    result: await runOperation({ operation: updateAccountingSettings, input }),
  });
}

/** Books every pending event into a new SIE export (ADR 0077); CONFLICT when none is pending. */
export async function createAccountingExportAction(): Promise<ActionResult<AccountingExportDto>> {
  return toActionResult({
    result: await runOperation({ operation: createAccountingExport, input: {} }),
  });
}

export type DownloadAccountingExportActionInput = { id: string };

/** The export's file as base64: SIE is codepage 437 bytes, not text. */
export async function downloadAccountingExportAction({
  id,
}: DownloadAccountingExportActionInput): Promise<ActionResult<AccountingExportFileDto>> {
  return toActionResult({
    result: await runOperation({ operation: downloadAccountingExport, input: { id } }),
  });
}
