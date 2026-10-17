import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckSeriesItemsInput = Db & {
  itemIds: string[];
  setupId: string | null;
  customerId: string;
};

/**
 * The template's items must be distinct active `BOOKABLE` items (ADR 0021) that are general or the series customer's own package, and a setup must be
 * one of the organization's active setups. Returns the setup's changeover time in minutes.
 */
export async function checkSeriesItems({
  context,
  itemIds,
  setupId,
  customerId,
}: CheckSeriesItemsInput): Promise<Result<number>> {
  const unique = new Set(itemIds);
  const found = await context.db.item.count({
    where: {
      id: { in: [...unique] },
      entityType: { behaviours: { has: "BOOKABLE" } },
      OR: [{ customerId: null }, { customerId }],
    },
  });
  if (unique.size !== itemIds.length || found !== unique.size) {
    const message = "Unknown or repeated bookable item";
    return invalid({ message, issues: [{ path: "itemIds", message }] });
  }
  if (!setupId) return ok({ value: 0 });
  const setup = await context.db.setup.findFirst({ where: { id: setupId } });
  if (!setup) {
    const message = "Unknown setup";
    return invalid({ message, issues: [{ path: "setupId", message }] });
  }
  return ok({ value: setup.changeoverMinutes });
}
