import type { AccountingExportDto, AccountingExportRangeInput } from "@bibi/core/schemas";
import type { ActionResult } from "@/lib/action-result";
import { downloadBytes } from "@/lib/download-bytes";
import { createAccountingExportAction, downloadAccountingExportAction } from "../actions";

export type CreateAndDownloadInput = { range: AccountingExportRangeInput };

/** Creates the export and saves its file at once; a failed download is reported as the error. */
export async function createAndDownload({
  range,
}: CreateAndDownloadInput): Promise<ActionResult<AccountingExportDto>> {
  const created = await createAccountingExportAction({ input: range });
  if (!created.ok) return created;
  const file = await downloadAccountingExportAction({ id: created.value.id });
  if (!file.ok) return { ok: false, error: file.error };
  const { contentBase64: base64, filename, mime: mimeType } = file.value;
  downloadBytes({ base64, filename, mimeType });
  return created;
}
