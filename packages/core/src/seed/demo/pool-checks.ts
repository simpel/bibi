import { freeUnits } from "../../features/item/pool-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoPoolsInput = { context: ExecuteContext; org: DemoOrg };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ADR 0059: every pool type's items are all free in a window far from every seeded booking, come
 * in name order, and the prepick is the first one. A second call returns the same answer.
 */
export async function checkDemoPools({ context, org }: CheckDemoPoolsInput) {
  const failures: string[] = [];
  const startsAt = new Date(Date.now() + 400 * DAY_MS);
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  for (const type of org.config.types.filter((candidate) => candidate.pool)) {
    const row = await context.db.entityType.findFirst({ where: { name: type.name, base: "ITEM" } });
    const want = org.config.items
      .filter((item) => item.type === type.name)
      .map((item) => item.name)
      .sort();
    const input = { entityTypeId: row?.id, startsAt, endsAt, limit: 100, tagValueIds: [] };
    const result = await execute({ operation: freeUnits, input, context });
    if (!row || !result.ok) {
      failures.push(`${org.slug}: could not list the pool ${type.name}`);
      continue;
    }
    const names = result.value.items.map((unit) => unit.name);
    if (names.join("|") !== want.join("|")) {
      failures.push(
        `${org.slug}: pool ${type.name} lists ${names.length}, expected ${want.length}`,
      );
    }
    if (result.value.prepickId !== result.value.items[0]?.id) {
      failures.push(`${org.slug}: pool ${type.name} prepick is not the first unit`);
    }
  }
  return failures;
}
