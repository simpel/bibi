import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createResponsibility } from "../../features/responsibility/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoRefs } from "./demo-refs";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type SeedDemoResponsibilitiesInput = {
  context: ExecuteContext;
  org: DemoOrg;
  refs: DemoRefs;
  userIds: DemoUserIds;
};

type Names = { kind: string; names: readonly string[]; ids: ReadonlyMap<string, string> };

/** The ids of the names, or `INTERNAL` for a name the data files got wrong. */
function resolve({ kind, names, ids }: Names): Result<string[]> {
  const found: string[] = [];
  for (const name of names) {
    const id = ids.get(name);
    if (!id)
      return err({ error: new AppError({ code: "INTERNAL", message: `Unknown ${kind} ${name}` }) });
    found.push(id);
  }
  return ok({ value: found });
}

/** Slice 2 of ADR 0025: responsibilities via `responsibility.create` as SYSTEM. */
export async function seedDemoResponsibilities({
  context,
  org,
  refs,
  userIds,
}: SeedDemoResponsibilitiesInput): Promise<Result<true>> {
  const typeIds = new Map([...refs.itemTypes].map(([name, type]) => [name, type.id]));
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
  }
  return ok({ value: true });
}
