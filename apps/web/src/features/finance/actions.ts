"use server";

import {
  type AccountingExportDto,
  type AccountingExportFileDto,
  type AccountingExportPreviewDto,
  type AccountingExportRangeInput,
  type AccountingSettingsDto,
  type AccountingSettingsUpdateInput,
  createAccountingExport,
  downloadAccountingExport,
  previewAccountingExport,
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

export type AccountingExportRangeActionInput = { input: AccountingExportRangeInput };

/** What an SIE export of the range would hold, for the export dialog (ADR 0077). */
export async function previewAccountingExportAction({
  input,
}: AccountingExportRangeActionInput): Promise<ActionResult<AccountingExportPreviewDto>> {
  return toActionResult({
    result: await runOperation({ operation: previewAccountingExport, input }),
  });
}

/** Writes a new SIE export of every voucher dated in the range, also those exported before. */
export async function createAccountingExportAction({
  input,
}: AccountingExportRangeActionInput): Promise<ActionResult<AccountingExportDto>> {
  return toActionResult({
    result: await runOperation({ operation: createAccountingExport, input }),
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
