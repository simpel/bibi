"use server";

import {
  getOrderVersion,
  nameOrderVersion,
  type OrderVersionDetail,
  restoreOrderVersion,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

type VersionResult = Promise<ActionResult<OrderVersionDetail>>;

/** One version with its changes against the order now, for the restore dialog (ADR 0116). */
export async function loadVersionAction({ id }: { id: string }): VersionResult {
  return toActionResult({
    result: await runOperation({ operation: getOrderVersion, input: { id } }),
  });
}

export async function restoreVersionAction({ id }: { id: string }): VersionResult {
  return toActionResult({
    result: await runOperation({ operation: restoreOrderVersion, input: { id } }),
  });
}

export type NameVersionActionInput = { input: { id: string; name: string | null } };

export async function nameVersionAction({ input }: NameVersionActionInput): VersionResult {
  return toActionResult({ result: await runOperation({ operation: nameOrderVersion, input }) });
}
