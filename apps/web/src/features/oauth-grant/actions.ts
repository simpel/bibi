"use server";

import { type OauthGrantDto, revokeOauthGrant } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type RevokeOauthGrantActionInput = { clientId: string };

export async function revokeOauthGrantAction({
  clientId,
}: RevokeOauthGrantActionInput): Promise<ActionResult<OauthGrantDto>> {
  return toActionResult({
    result: await runOperation({ operation: revokeOauthGrant, input: { clientId } }),
  });
}
