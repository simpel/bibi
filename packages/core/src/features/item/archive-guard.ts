import type { Result } from "../../errors/result";
import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { inUseConflict } from "../../shared/in-use";

export type ItemsInUseInput = {
  context: OperationContext;
  items: readonly { id: string; name: string }[];
};

type DemandUseInput = { context: OperationContext; ids: string[]; what: string };

/**
 * ADR 0059: an item allocated as a unit on a line that has not ended, or the target of an active
 * demand, is in use.
 */
async function demandUse({ context, ids, what }: DemandUseInput): Promise<Result<true>> {
  const allocated = await context.db.lineAllocation.count({
    where: {
      unitId: { in: ids },
      line: { status: "ACTIVE", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
    },
  });
  if (allocated > 0) {
    const message = `${what} is allocated to ${allocated} active lines`;
    return inUseConflict({ context, feature: "program", message });
  }
  const demands = await context.db.itemDemand.count({ where: { targetItemId: { in: ids } } });
  if (demands > 0) {
    const message = `${what} is the target of ${demands} demands`;
    return inUseConflict({ context, feature: "item", message });
  }
  return ok({ value: true });
}

/**
 * CONFLICT while an active line, an active manual block (maintenance or internal occupancy) or a
 * predefined ticket line uses one of the items (#213, #224), or it is allocated or demanded
 * (ADR 0059). Line holds follow their lines by
 * trigger, so only manual blocks are checked on their own. The one guard for `item.archive` and
 * the `customer.archive` bundle cascade.
 */
export async function checkItemsUnused({ context, items }: ItemsInUseInput): Promise<Result<true>> {
  const ids = items.map(({ id }) => id);
  const what = items.length === 1 ? (items[0]?.name ?? "The item") : `${items.length} bundles`;
  const where = { itemId: { in: ids } };
  const scheduled = await context.db.line.count({ where });
  if (scheduled > 0) {
    const message = `${what} is used by ${scheduled} active lines`;
    return inUseConflict({ context, feature: "program", message });
  }
  const blocks = await context.db.occupancy.count({ where: { ...where, lineId: null } });
  if (blocks > 0) {
    const message = `${what} has ${blocks} active occupancy blocks`;
    return inUseConflict({ context, feature: "ticket", message });
  }
  const demanded = await demandUse({ context, ids, what });
  if (!demanded.ok) return demanded;
  const templated = await context.db.ticketTemplateLine.count({
    where: { ...where, template: { status: "ACTIVE" } },
  });
  if (templated > 0) {
    const message = `${what} is used by ${templated} predefined ticket lines`;
    return inUseConflict({ context, feature: "template", message });
  }
  return ok({ value: true });
}
