import type { ExecuteContext } from "../../operations/context";
import { DEMO_TYPE_GROUPS, groupOfDemoType } from "./item-type-groups";
import type { DemoOrg } from "./types";

export type CheckDemoItemTypeGroupsInput = { context: ExecuteContext; org: DemoOrg };

/** ADR 0101: the three groups exist in order and every item type is in its group. */
export async function checkDemoItemTypeGroups({
  context,
  org,
}: CheckDemoItemTypeGroupsInput): Promise<string[]> {
  const itemTypes = org.config.types.filter((type) => type.base === "ITEM");
  if (itemTypes.length === 0) return [];
  const groups = await context.db.itemTypeGroup.findMany({ orderBy: { position: "asc" } });
  const failures: string[] = [];
  const names = groups.map((group) => group.name);
  if (names.join("|") !== DEMO_TYPE_GROUPS.join("|")) {
    failures.push(`${org.slug}: item type groups are [${names.join(", ")}]`);
  }
  const rows = await context.db.entityType.findMany({
    where: { base: "ITEM" },
    select: { name: true, group: { select: { name: true } } },
  });
  for (const type of itemTypes) {
    const actual = rows.find((row) => row.name === type.name)?.group?.name ?? null;
    const expected = groupOfDemoType({ type });
    if (actual !== expected) {
      failures.push(
        `${org.slug}: item type ${type.name} is in group ${actual}, expected ${expected}`,
      );
    }
  }
  return failures;
}
