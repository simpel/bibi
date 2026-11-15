import type { OperationContext } from "../../operations/types";
import { slotsOf } from "../assignment/slots-of";
import { CONCERN_REASONS, type ConcernReason } from "./schema";

type Context = Pick<OperationContext, "db">;

/** Instants `[start, end)` that bound the lines looked at. */
export type ConcernWindow = { start: Date; end: Date };

/** Everything that ties the member to orders, run sheets and lines; derived on read (ADR 0055). */
export type Concerns = {
  /** Main assignment of an order: ASSIGNEE or FOLLOWER. */
  orders: Map<string, Set<ConcernReason>>;
  /** `<orderId>:<responsibilityId>`: RESPONSIBILITY or RESPONSIBILITY_FOLLOWER. */
  slots: Map<string, Set<ConcernReason>>;
  /** `<orderId>:<runSheetDefinitionId>`: the member received a version (RECIPIENT). */
  received: Set<string>;
  /** Line id: STAFFED or ITEM. */
  lines: Map<string, Set<ConcernReason>>;
};

export type ConcernsInput = { context: Context; userId: string; window: ConcernWindow };

const add = ({
  map,
  key,
  reason,
}: {
  map: Map<string, Set<ConcernReason>>;
  key: string;
  reason: ConcernReason;
}) => {
  const set = map.get(key) ?? new Set<ConcernReason>();
  set.add(reason);
  map.set(key, set);
};

/** The orders whose main assignee is the member, or that the member follows. */
async function mainAssignments({ context, userId }: Omit<ConcernsInput, "window">) {
  const rows = await context.db.assignment.findMany({
    where: {
      status: "ACTIVE",
      responsibilityId: null,
      record: { base: "ORDER" },
      OR: [{ assigneeId: userId }, { followers: { some: { userId, effect: "FOLLOW" } } }],
    },
    select: { recordId: true, assigneeId: true },
  });
  const orders = new Map<string, Set<ConcernReason>>();
  for (const row of rows) {
    const reason = row.assigneeId === userId ? "ASSIGNEE" : "FOLLOWER";
    add({ map: orders, key: row.recordId, reason });
  }
  return orders;
}

/** The responsibility slots the member answers for or follows, chosen or by default. */
async function responsibilitySlots({ context, userId }: Omit<ConcernsInput, "window">) {
  const [assigned, following] = await Promise.all([
    slotsOf({ context, userId, kind: "ASSIGNED" }),
    slotsOf({ context, userId, kind: "FOLLOWING" }),
  ]);
  const slots = new Map<string, Set<ConcernReason>>();
  for (const s of assigned)
    add({ map: slots, key: `${s.orderId}:${s.responsibilityId}`, reason: "RESPONSIBILITY" });
  for (const s of following) {
    add({
      map: slots,
      key: `${s.orderId}:${s.responsibilityId}`,
      reason: "RESPONSIBILITY_FOLLOWER",
    });
  }
  return slots;
}

/** The order and definition pairs of run sheets the member received. */
async function receivedRunSheets({ context, userId }: Omit<ConcernsInput, "window">) {
  const rows = await context.db.runSheetRecipient.findMany({
    where: { userId },
    select: { runSheet: { select: { orderId: true, runSheetDefinitionId: true } } },
  });
  return new Set(
    rows.map(({ runSheet }) => `${runSheet.orderId}:${runSheet.runSheetDefinitionId}`),
  );
}

/** The member's linked staff items (member profile) and the items they are assigned or follow. */
async function memberItems({ context, userId }: Omit<ConcernsInput, "window">) {
  const [links, assigned] = await Promise.all([
    context.db.memberProfileItem.findMany({
      where: { memberProfile: { status: "ACTIVE", member: { userId } } },
      select: { itemId: true },
    }),
    context.db.assignment.findMany({
      where: {
        status: "ACTIVE",
        responsibilityId: null,
        record: { base: "ITEM" },
        OR: [{ assigneeId: userId }, { followers: { some: { userId, effect: "FOLLOW" } } }],
      },
      select: { recordId: true },
    }),
  ]);
  return { staff: links.map((l) => l.itemId), owned: assigned.map((a) => a.recordId) };
}

/** Lines in the window the member is staffed on (directly or by allocation) or whose item they own. */
async function concernedLines({ context, userId, window }: ConcernsInput) {
  const { staff, owned } = await memberItems({ context, userId });
  const lines = new Map<string, Set<ConcernReason>>();
  if (staff.length === 0 && owned.length === 0) return lines;
  const inWindow = { status: "ACTIVE", startsAt: { gte: window.start, lt: window.end } } as const;
  const [direct, allocated] = await Promise.all([
    context.db.line.findMany({
      where: { ...inWindow, itemId: { in: [...staff, ...owned] } },
      select: { id: true, itemId: true },
    }),
    staff.length === 0
      ? []
      : context.db.lineAllocation.findMany({
          where: { status: "ACTIVE", unitId: { in: staff }, line: inWindow },
          select: { lineId: true },
        }),
  ]);
  const staffSet = new Set(staff);
  for (const line of direct) {
    add({
      map: lines,
      key: line.id,
      reason: line.itemId && staffSet.has(line.itemId) ? "STAFFED" : "ITEM",
    });
  }
  for (const allocation of allocated)
    add({ map: lines, key: allocation.lineId, reason: "STAFFED" });
  return lines;
}

/**
 * What concerns the member ("Concerns me", spec: assignments-and-responsibilities): main
 * assignee or follower of an order, assignee or follower of a responsibility on it (chosen or by
 * default, minus an unfollow), staffed on a line by a linked staff item, assignee or follower of
 * a line's item, or recipient of a run sheet. Nothing is stored.
 */
export async function concernsOf({ context, userId, window }: ConcernsInput): Promise<Concerns> {
  const [orders, slots, received, lines] = await Promise.all([
    mainAssignments({ context, userId }),
    responsibilitySlots({ context, userId }),
    receivedRunSheets({ context, userId }),
    concernedLines({ context, userId, window }),
  ]);
  return { orders, slots, received, lines };
}

/** The reasons strongest first (the order of `CONCERN_REASONS`). */
export function sortReasons({ reasons }: { reasons: Iterable<ConcernReason> }): ConcernReason[] {
  return [...new Set(reasons)].sort(
    (a, b) => CONCERN_REASONS.indexOf(a) - CONCERN_REASONS.indexOf(b),
  );
}

/** Reasons the member must act on, not only be told: assignee, responsibility owner, staffed. */
export const ACTING_REASONS: ReadonlySet<ConcernReason> = new Set([
  "ASSIGNEE",
  "RESPONSIBILITY",
  "STAFFED",
]);
