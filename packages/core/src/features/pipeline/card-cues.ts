import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { expiringHolds } from "../dashboard/attention";
import type { DashboardHorizon } from "../dashboard/horizon";
import { flagOf, messageFlags, quoteFlags } from "../my-work/flags";
import type { MyWorkFlag } from "../my-work/schema";
import { loadOccupancy } from "../order/plan/occupancy-rows";
import { softHoldClashes } from "../order/plan/soft-hold-clashes";

type Context = Pick<OperationContext, "db" | "permissions" | "actor">;

export type CardCuesInput = { context: Context; orderIds: string[]; horizon: DashboardHorizon };

/** The orders the caller follows without being their main assignee (spec: home, Tone). */
async function followedOnly({ context, orderIds }: Omit<CardCuesInput, "horizon">) {
  const userId = context.actor.userId;
  if (!userId || orderIds.length === 0) return new Set<string>();
  const rows = await context.db.assignment.findMany({
    where: {
      status: "ACTIVE",
      responsibilityId: null,
      recordId: { in: orderIds },
      followers: { some: { userId, effect: "FOLLOW" } },
      NOT: { assigneeId: userId },
    },
    select: { recordId: true },
  });
  return new Set(rows.map((row) => row.recordId));
}

/**
 * Per order, the first other order whose hard hold (or a block) overlaps one of its soft holds
 * still to come. Line states need `program:read`, availability `item:read`.
 */
async function clashFlags({ context, orderIds, horizon }: CardCuesInput) {
  const allowed = canView({ context, feature: "program" }) && canView({ context, feature: "item" });
  if (!allowed || orderIds.length === 0) return [];
  const lines = await context.db.line.findMany({
    where: {
      ...{ orderId: { in: orderIds }, status: "ACTIVE", itemId: { not: null } },
      ...{ state: { hold: "SOFT" }, startsAt: { not: null }, endsAt: { gt: horizon.now } },
    },
    select: {
      ...{ id: true, orderId: true, itemId: true, startsAt: true, endsAt: true },
      order: { select: { reference: true } },
    },
  });
  if (lines.length === 0) return [];
  const starts = lines.map((line) => line.startsAt?.getTime() ?? 0);
  const ends = lines.map((line) => line.endsAt?.getTime() ?? 0);
  const window = { startsAt: new Date(Math.min(...starts)), endsAt: new Date(Math.max(...ends)) };
  const itemIds = lines.flatMap((line) => (line.itemId ? [line.itemId] : []));
  const rows = await loadOccupancy({ context, itemIds, window });
  const { clashes } = softHoldClashes({ lines, rows });
  const seen = new Set<string>();
  return lines.flatMap((line) => {
    const clash = clashes.get(line.id)?.[0];
    if (!clash || seen.has(line.orderId)) return [];
    seen.add(line.orderId);
    return [
      {
        orderId: line.orderId,
        flag: flagOf({ kind: "HARD_CLASH", reference: clash.orderReference }),
      },
    ];
  });
}

/**
 * The board cards' cues (spec: pipeline): which orders the caller only follows, and each order's
 * flags, blocks first: a clash with another order's hard hold, holds running out, a quote waiting
 * on the customer (`quote:read`) and unread customer messages (`inbox:read`).
 */
export async function cardCues({ context, orderIds, horizon }: CardCuesInput) {
  const [following, clashes, holds, quotes, messages] = await Promise.all([
    followedOnly({ context, orderIds }),
    clashFlags({ context, orderIds, horizon }),
    orderIds.length > 0 ? expiringHolds({ context, horizon, orderIds }) : [],
    orderIds.length > 0 && canView({ context, feature: "quote" })
      ? quoteFlags({ context, orderIds })
      : [],
    orderIds.length > 0 && canView({ context, feature: "inbox" })
      ? messageFlags({ context, orderIds })
      : [],
  ]);
  const holdFlags = holds.map((hold) => ({
    orderId: hold.orderId,
    flag: flagOf({ kind: "HOLD_EXPIRES", at: hold.holdsUntil }),
  }));
  const flags = new Map<string, MyWorkFlag[]>();
  for (const { orderId, flag } of [...clashes, ...holdFlags, ...quotes, ...messages]) {
    flags.set(orderId, [...(flags.get(orderId) ?? []), flag]);
  }
  return { following, flags };
}
