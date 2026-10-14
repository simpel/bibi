import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";

type Setups = readonly { setupId: string; capacity: number }[];

export type CheckSetupsInput = { context: Pick<OperationContext, "db">; setups: Setups };

/** Each setup is active, and listed at most once. */
export async function checkSetups({ context, setups }: CheckSetupsInput): Promise<Result<true>> {
  const ids = setups.map((setup) => setup.setupId);
  if (new Set(ids).size !== ids.length) {
    const message = "A setup is listed twice";
    return invalid({ message, issues: [{ path: "setups", message }] });
  }
  const found = await context.db.setup.count({ where: { id: { in: ids } } });
  if (found !== ids.length) {
    const message = "Unknown setup";
    return invalid({ message, issues: [{ path: "setups", message }] });
  }
  return ok({ value: true });
}

export type ReplaceSetupsInput = { context: OperationContext; itemId: string; setups: Setups };

/** Replaces the item's capacities. Join rows have no history of their own; audit has the item. */
export async function replaceSetups({ context, itemId, setups }: ReplaceSetupsInput) {
  await context.db.itemSetup.deleteMany({ where: { itemId } });
  await context.db.itemSetup.createMany({
    data: setups.map((setup) => ({
      ...setup,
      itemId,
      organizationId: context.organizationId,
    })),
  });
}
