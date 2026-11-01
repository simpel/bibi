"use server";

import {
  type OrganizationProfileDto,
  type OrganizationProfileSetDomainJoinInput,
  setOrganizationDomainJoin,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/** `/settings/organization`: domain join on or off (ADR 0076). */
export async function setDomainJoinAction({
  input,
}: {
  input: OrganizationProfileSetDomainJoinInput;
}): Promise<ActionResult<OrganizationProfileDto>> {
  const result = await runOperation({ operation: setOrganizationDomainJoin, input });
  return toActionResult({ result });
}
