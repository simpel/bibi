import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { type Demand, demandWindows } from "./free-unit";
import type { LineWindow } from "./line-windows";

type Db = { context: Pick<OperationContext, "db" | "permissions"> };

/** The pool's name for a caller who may read items, else its id (ADR 0050). */
async function poolName({ context, demand }: Db & { demand: Demand }) {
  const id = demand.entityTypeId ?? demand.targetItemId ?? demand.id;
  if (!hasPermission({ permissions: context.permissions, permission: "item:read" })) return id;
  const named = demand.entityTypeId
    ? await context.db.entityType.findFirst({ where: { id }, select: { name: true } })
    : await context.db.item.findFirst({ where: { id }, select: { name: true } });
  return named?.name ?? id;
}

type DescribeInput = Db & { window: LineWindow };

/** A window by kind, with its times only for a caller who may read the line (`program:read`). */
const describeWindow = ({ context, window: { window, startsAt, endsAt } }: DescribeInput) =>
  hasPermission({ permissions: context.permissions, permission: "program:read" })
    ? `${window} ${startsAt.toISOString()}–${endsAt.toISOString()}`
    : window;

export type MissingUnitInput = Db & { demand: Demand; windows: LineWindow[]; lineId: string };

/**
 * ADR 0059: a mandatory demand is met only when a unit is allocated. With no free unit the
 * change is refused with CONFLICT naming the pool (its name only with `item:read`) and the
 * windows (their times only with `program:read`, ADR 0050), at `lines.<id>.demands.<id>`.
 */
export async function missingUnit({ context, demand, windows, lineId }: MissingUnitInput) {
  const held = demandWindows({ demand, windows });
  const when = held.length
    ? held.map((window) => describeWindow({ context, window })).join(", ")
    : "the line";
  const message = `No free unit in the pool ${await poolName({ context, demand })} for ${when}`;
  return conflict({
    message,
    issues: [{ path: `lines.${lineId}.demands.${demand.id}`, message }],
  });
}
