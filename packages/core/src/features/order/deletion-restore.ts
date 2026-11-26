import { allBlockers, archivedParent } from "../../archive/blockers";
import type { KindInput } from "../../archive/lifecycle-kind";
import { ok, type Result } from "../../errors/result";
import { updateRecords } from "../../records/update-record";
import { reviveLine } from "../order-version/restore";

/** Lines archived with the order whose item is archived now: they cannot come back. */
async function archivedItems({ context, id, since }: KindInput & { since: Date | null }) {
  if (!since) return [];
  const count = await context.db.line.count({
    where: {
      orderId: id,
      status: "ARCHIVED",
      updatedAt: { gte: since },
      item: { status: "ARCHIVED" },
    },
  });
  return count > 0
    ? [
        {
          feature: "item" as const,
          path: "lines",
          message: `Restore the items of ${count} lines first`,
        },
      ]
    : [];
}

/** Its customer, contact, type, status and its lines' items must be active to restore it. */
export async function orderRestoreBlockers({ context, id }: KindInput) {
  const order = await context.db.order.findFirst({
    where: { id, status: "ARCHIVED" },
    select: {
      archivedAt: true,
      customer: { select: { status: true } },
      contact: { select: { status: true } },
      entityType: { select: { status: true } },
      orderStatus: { select: { status: true } },
    },
  });
  return allBlockers({
    checks: [
      archivedParent({
        status: order?.customer.status,
        ...{ feature: "customer", path: "customerId", what: "customer" },
      }),
      archivedParent({
        status: order?.contact?.status,
        ...{ feature: "customer", path: "contactId", what: "contact" },
      }),
      archivedParent({
        status: order?.entityType.status,
        ...{ feature: "configuration", path: "entityTypeId", what: "type" },
      }),
      archivedParent({
        status: order?.orderStatus.status,
        ...{ feature: "pipeline", path: "statusId", what: "status" },
      }),
      archivedItems({ context, id, since: order?.archivedAt ?? null }),
    ],
  });
}

type SinceInput = KindInput & { since: Date };

/** Its requirements and alternative groups archived with it, active again. */
async function reviveRest({ context, id, since }: SinceInput) {
  const where = { orderId: id, status: "ARCHIVED" as const, updatedAt: { gte: since } };
  const requirements = await context.db.requirement.findMany({ where, select: { id: true } });
  const ids = requirements.map((row) => row.id);
  await context.db.requirement.updateMany({
    where: { id: { in: ids }, status: "ARCHIVED" },
    data: { status: "ACTIVE" },
  });
  await updateRecords({ context, ids, change: { status: "ACTIVE" } });
  await context.db.alternativeGroup.updateMany({ where, data: { status: "ACTIVE" } });
}

/**
 * Brings back the lines, groups and requirements archived with the order (`archiveOrder` stamps
 * `archivedAt` before it archives them; anything archived earlier stays archived). Each line gets
 * the state the grid gives a new line and its hold again: a line whose item was taken meanwhile
 * refuses the restore (CONFLICT naming it). Then `archivedAt` is cleared.
 */
export async function reviveOrderContent({ context, id }: KindInput): Promise<Result<true>> {
  const order = await context.db.order.findFirst({ where: { id }, select: { archivedAt: true } });
  const since = order?.archivedAt;
  if (since) {
    await reviveRest({ context, id, since });
    const lines = await context.db.line.findMany({
      where: { orderId: id, status: "ARCHIVED", updatedAt: { gte: since } },
      select: { id: true, parentLineId: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const parentsFirst = [...lines].sort(
      (a, b) => Number(a.parentLineId !== null) - Number(b.parentLineId !== null),
    );
    for (const line of parentsFirst) {
      const revived = await reviveLine({ context, orderId: id, lineId: line.id });
      if (!revived.ok) return revived;
    }
  }
  await context.db.order.update({ where: { id }, data: { archivedAt: null } });
  return ok({ value: true });
}
