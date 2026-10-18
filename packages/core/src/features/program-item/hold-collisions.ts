import type { AppErrorIssue } from "../../errors/app-error";
import type { OperationContext } from "../../operations/types";
import type { ItemStateFlags } from "../item-state/schema";
import { PROGRAM_ITEM_SOURCE, type ProgramItemDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type HoldCollisionsInput = Db & {
  line: ProgramItemDto;
  /** The state the line would move to. */
  to: Pick<ItemStateFlags, "hold" | "released">;
};

const day = ({ at }: { at: Date }) => at.toISOString().slice(0, 10);

/** The period the line would block: its own, plus its setup's changeover time right before. */
async function blockedPeriod({ context, line }: Db & { line: ProgramItemDto }) {
  const setup = line.setupId
    ? await context.db.setup.findFirst({ where: { id: line.setupId } })
    : null;
  const before = (setup?.changeoverMinutes ?? 0) * 60_000;
  return { startsAt: new Date(line.startsAt.getTime() - before), endsAt: line.endsAt };
}

type Holder = { sourceType: string | null; sourceId: string | null };

/** Ticket reference per line id, for the lines among the holders (one query). */
async function ticketRefs({ context, holders }: Db & { holders: readonly Holder[] }) {
  const ids = holders.flatMap((holder) =>
    holder.sourceType === PROGRAM_ITEM_SOURCE && holder.sourceId ? [holder.sourceId] : [],
  );
  const lines = await context.db.programItem.findMany({
    where: { id: { in: ids } },
    select: { id: true, ticket: { select: { reference: true } } },
  });
  return new Map(lines.map((line) => [line.id, line.ticket.reference]));
}

/**
 * What a line moving into a state would collide with (ADR 0044): only a `HARD` hold on a
 * `BOOKABLE` item can collide, with another hard hold, setup time or block on the item in the same
 * period. One issue per collision, e.g. "Knippla is booked by ticket #42 on 2026-03-14". The
 * database's exclusion constraint stays the guarantee; this names the blockers up front.
 */
export async function holdCollisions({
  context,
  line,
  to,
}: HoldCollisionsInput): Promise<AppErrorIssue[]> {
  if (!line.itemId || to.released || to.hold !== "HARD") return [];
  const item = await context.db.item.findFirst({
    where: { id: line.itemId, entityType: { behaviours: { has: "BOOKABLE" } } },
    select: { name: true },
  });
  if (!item) return [];
  const period = await blockedPeriod({ context, line });
  const holders = await context.db.occupancy.findMany({
    where: {
      itemId: line.itemId,
      startsAt: { lt: period.endsAt },
      endsAt: { gt: period.startsAt },
      AND: [
        { OR: [{ type: { not: "HOLD" } }, { holdKind: "HARD" }] },
        // Not the line's own rows; manual blocks have no source.
        { OR: [{ sourceId: null }, { sourceId: { not: line.id } }] },
      ],
    },
    orderBy: { startsAt: "asc" },
  });
  const refs = await ticketRefs({ context, holders });
  const path = `lines.${line.id}`;
  return holders.map((holder) => {
    const ref = holder.sourceId ? refs.get(holder.sourceId) : undefined;
    const by = ref === undefined ? `blocked (${holder.type})` : `booked by ticket #${ref}`;
    const message = `"${line.name}": ${item.name} is ${by} on ${day({ at: holder.startsAt })}`;
    return { path, message };
  });
}
