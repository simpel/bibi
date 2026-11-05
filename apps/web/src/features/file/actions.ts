"use server";

import { type FileUploadInput, uploadFile } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/**
 * Upload a file (png, jpeg or webp, at most 2 MB) for the caller and return its storage key (ADR 0063).
 */
export async function uploadFileAction({
  input,
}: {
  input: FileUploadInput;
}): Promise<ActionResult<{ key: string }>> {
  return toActionResult({ result: await runOperation({ operation: uploadFile, input }) });
}
