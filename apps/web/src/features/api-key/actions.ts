"use server";

import {
  type ApiKeyCreated,
  type ApiKeyCreateInput,
  type ApiKeyDto,
  createApiKey,
  revokeApiKey,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateApiKeyActionInput = { input: ApiKeyCreateInput };
export type RevokeApiKeyActionInput = { id: string };

/** The secret in the result is shown once by the dialog and never stored by the app. */
export async function createApiKeyAction({
  input,
}: CreateApiKeyActionInput): Promise<ActionResult<ApiKeyCreated>> {
  return toActionResult({ result: await runOperation({ operation: createApiKey, input }) });
}

export async function revokeApiKeyAction({
  id,
}: RevokeApiKeyActionInput): Promise<ActionResult<ApiKeyDto>> {
  return toActionResult({ result: await runOperation({ operation: revokeApiKey, input: { id } }) });
}
