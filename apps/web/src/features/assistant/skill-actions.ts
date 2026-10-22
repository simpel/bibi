"use server";

import { listSkills } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/** A skill as the prompt box's picker lists it. */
export type SkillOption = { id: string; name: string; description: string };

/** Published skills the user can use (system, organization, personal), by name. */
export async function listSkillOptionsAction(): Promise<ActionResult<SkillOption[]>> {
  const result = await runOperation({
    operation: listSkills,
    input: { status: "PUBLISHED", limit: 100 },
  });
  if (!result.ok) return toActionResult({ result });
  const items = result.value.items.map(({ id, name, description }) => ({ id, name, description }));
  return toActionResult({ result: { ok: true, value: items } });
}
