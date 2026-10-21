import type { AppErrorIssue } from "../../errors/app-error";
import type { OperationContext } from "../../operations/types";
import { effectiveBuffers } from "../../shared/buffers";
import type { ItemStateFlags } from "../item-state/schema";
import type { LineRecord } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type HoldCollisionsInput = Db & {
  line: LineRecord;
  /** The state the line would move to. */
  to: Pick<ItemStateFlags, "hold" | "released">;
};

const day = ({ at }: { at: Date }) => at.toISOString().slice(0, 10);

/**
 * The period the line would block (ADR 0059): its own, plus its effective setup right before and
 * teardown right after, as the trigger derives them.
 */
async function blockedPeriod({ context, line }: Db & { line: TimedLine & { itemId: string } }) {
  const [item, setup] = await Promise.all([
    context.db.item.findFirst({
      where: { id: line.itemId },
      select: {
        ...{ setupMinutes: true, teardownMinutes: true },
        entityType: { select: { setupMinutes: true, teardownMinutes: true } },
      },
    }),
    line.setupId ? context.db.setup.findFirst({ where: { id: line.setupId } }) : null,
  ]);
  const buffers = effectiveBuffers({
    line,
    item,
    type: item?.entityType ?? null,
    changeoverMinutes: setup?.changeoverMinutes ?? null,
  });
  return {
    startsAt: new Date(line.startsAt.getTime() - buffers.effectiveSetupMinutes * 60_000),
    endsAt: new Date(line.endsAt.getTime() + buffers.effectiveTeardownMinutes * 60_000),
  };
}

type TimedLine = LineRecord & { startsAt: Date; endsAt: Date };

type Holder = { lineId: string | null };

/** Ticket reference per line id, for the lines among the holders (one query). */
async function ticketRefs({ context, holders }: Db & { holders: readonly Holder[] }) {
  const ids = holders.flatMap((holder) => (holder.lineId ? [holder.lineId] : []));
  const lines = await context.db.line.findMany({
    where: { id: { in: ids } },
    select: { id: true, ticket: { select: { reference: true } } },
  });
  return new Map(lines.map((line) => [line.id, line.ticket.reference]));
}

/**
 * What a line moving into a state would collide with (ADR 0044): only a `HARD` hold on a
 * `BOOKABLE` item can collide, with another hard hold or buffer or a block on the item in the
 * period it would block with its buffers. One issue per collision, e.g. "Knippla is booked by ticket #42 on 2026-03-14". The
 * database's exclusion constraint stays the guarantee; this names the blockers up front.
 */
export async function holdCollisions({
  context,
  line,
  to,
}: HoldCollisionsInput): Promise<AppErrorIssue[]> {
  if (!line.itemId || to.released || to.hold !== "HARD") return [];
  const { startsAt, endsAt } = line;
  // ADR 0052: an untimed line never holds, so it cannot collide.
  if (!startsAt || !endsAt) return [];
  const item = await context.db.item.findFirst({
    where: { id: line.itemId, entityType: { capabilities: { has: "BOOKABLE" } } },
    select: { name: true },
  });
  if (!item) return [];
  const timed = { ...line, itemId: line.itemId, startsAt, endsAt };
  const period = await blockedPeriod({ context, line: timed });
  const holders = await context.db.occupancy.findMany({
    where: {
      itemId: line.itemId,
      startsAt: { lt: period.endsAt },
      endsAt: { gt: period.startsAt },
      AND: [
        // Soft holds and soft buffers never block; manual blocks have no kind.
        { OR: [{ holdKind: null }, { holdKind: "HARD" }] },
        // Not the line's own rows; manual blocks have no line.
        { OR: [{ lineId: null }, { lineId: { not: line.id } }] },
      ],
    },
    orderBy: { startsAt: "asc" },
  });
  const refs = await ticketRefs({ context, holders });
  const path = `lines.${line.id}`;
  return holders.map((holder) => {
    const ref = holder.lineId ? refs.get(holder.lineId) : undefined;
    const by = ref === undefined ? `blocked (${holder.type})` : `booked by ticket #${ref}`;
    const message = `"${line.name}": ${item.name} is ${by} on ${day({ at: holder.startsAt })}`;
    return { path, message };
  });
}
