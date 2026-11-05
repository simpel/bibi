import type { Result } from "../../errors/result";
import { createResponsibility } from "../../features/responsibility/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoRefs } from "./demo-refs";
import { resolveNames as resolve } from "./resolve-names";
import { seedDemoRunSheetDefinitions } from "./seed-run-sheet-definitions";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type SeedDemoResponsibilitiesInput = {
  context: ExecuteContext;
  org: DemoOrg;
  refs: DemoRefs;
  userIds: DemoUserIds;
};

/**
 * Slice 2 of ADR 0025: responsibilities via `responsibility.create` as SYSTEM, then the run sheet
 * definitions that go to them.
 */
export async function seedDemoResponsibilities({
  context,
  org,
  refs,
  userIds,
}: SeedDemoResponsibilitiesInput): Promise<Result<true>> {
  const typeIds = new Map([...refs.itemTypes].map(([name, type]) => [name, type.id]));
  const responsibilityIds = new Map<string, string>();
  for (const { name, types, assignee, followers = [] } of org.responsibilities) {
    const entityTypeIds = resolve({ kind: "item type", names: types, ids: typeIds });
    if (!entityTypeIds.ok) return entityTypeIds;
    const people = resolve({ kind: "user", names: [assignee, ...followers], ids: userIds });
    if (!people.ok) return people;
    const [defaultAssigneeId = "", ...defaultFollowerIds] = people.value;
    const input = {
      name,
      entityTypeIds: entityTypeIds.value,
      defaultAssigneeId,
      defaultFollowerIds,
    };
    const result = await execute({ operation: createResponsibility, input, context });
    if (!result.ok) return result;
    responsibilityIds.set(name, result.value.id);
  }
  return seedDemoRunSheetDefinitions({ context, org, refs, responsibilityIds });
}
