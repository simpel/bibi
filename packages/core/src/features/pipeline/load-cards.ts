import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { subjectIdFilter } from "../assignment/subject-filter";
import { LATEST_STATUS_CHANGE } from "../ticket/status-history";
import type { PipelineBoardInput, PipelineCard } from "./schema";

/** A card before it is placed in a column of the board. */
export type LoadedCard = Omit<PipelineCard, "columnId">;

/** Upper bound of cards, so one board response stays small. */
const CARD_LIMIT = 500;

type Db = Pick<OperationContext, "db">;
export type LoadCardsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  input: PipelineBoardInput;
  since: Date;
  /** Which statuses: the board's (`in`) or every other (`notIn`). */
  statusIds: { in: string[] } | { notIn: string[] };
};

async function mainAssignees({ context, ids }: { context: Db; ids: string[] }) {
  const rows = await context.db.assignment.findMany({
    where: { recordId: { in: ids }, responsibilityId: null },
    select: { recordId: true, assigneeId: true },
  });
  return new Map(rows.map((row) => [row.recordId, row.assigneeId]));
}

type Counts = { heldLines: number; bookedLines: number };

/** Per ticket: how many lines are in a soft-hold and in a hard-hold state (ADR 0044). */
async function lineCounts({ context, ids }: { context: Db; ids: string[] }) {
  const lines = await context.db.line.findMany({
    where: { ticketId: { in: ids }, status: "ACTIVE", state: { hold: { in: ["SOFT", "HARD"] } } },
    select: { ticketId: true, state: { select: { hold: true } } },
  });
  const counts = new Map<string, Counts>();
  for (const line of lines) {
    const current = counts.get(line.ticketId) ?? { heldLines: 0, bookedLines: 0 };
    if (line.state?.hold === "SOFT") current.heldLines += 1;
    else current.bookedLines += 1;
    counts.set(line.ticketId, current);
  }
  return counts;
}

/** Tickets in open statuses, plus those that entered a closing status since `since`. */
/**
 * Open tickets, and closed ones that entered their closing status since `since`: nothing leaves
 * a closing status, so a change into one is the current one (status history, ADR 0054).
 */
const openOrRecentlyClosed = ({ since }: { since: Date }) => [
  { ticketStatus: { closes: false } },
  {
    ticketStatus: { closes: true },
    statusChanges: { some: { changedAt: { gte: since }, toStatus: { closes: true } } },
  },
];

/** The tickets a board shows: its filter, open or recently closed, in the given statuses. */
async function ticketWhere({ context, input, since, statusIds }: LoadCardsInput) {
  const { assigneeId, entityTypeId } = input;
  const ids = await subjectIdFilter({ context, subjectType: "TICKET", assigneeId });
  return {
    ...ids,
    ...(entityTypeId ? { entityTypeId } : {}),
    statusId: statusIds,
    OR: openOrRecentlyClosed({ since }),
  };
}

/** Matching tickets whose status is on no phase of the board (`statusIds` is `notIn` here). */
export async function countTickets({ context, ...query }: LoadCardsInput) {
  return context.db.ticket.count({ where: await ticketWhere({ context, ...query }) });
}

export async function loadTicketCards({
  context,
  ...query
}: LoadCardsInput): Promise<LoadedCard[]> {
  const rows = await context.db.ticket.findMany({
    where: await ticketWhere({ context, ...query }),
    include: { entityType: { select: { name: true } }, ...LATEST_STATUS_CHANGE },
    orderBy: [{ reference: "desc" }, { id: "desc" }],
    take: CARD_LIMIT,
  });
  const owners = await mainAssignees({ context, ids: rows.map((row) => row.id) });
  // Line states belong to the program: counted only for a caller who may view it (ADR 0050).
  const counted = canView({ context, feature: "program" });
  const lines = counted ? await lineCounts({ context, ids: rows.map((row) => row.id) }) : null;
  const none = counted ? { heldLines: 0, bookedLines: 0 } : { heldLines: null, bookedLines: null };
  return rows.map((row) => ({
    ...(lines?.get(row.id) ?? none),
    id: row.id,
    statusId: row.statusId,
    reference: row.reference,
    typeName: row.entityType.name,
    customerId: row.customerId,
    startsAt: row.desiredStartsAt,
    endsAt: row.desiredEndsAt,
    quantity: row.guaranteedHeadcount ?? row.estimatedHeadcount,
    statusChangedAt: row.statusChanges[0]?.changedAt ?? row.createdAt,
    assigneeId: owners.get(row.id) ?? null,
  }));
}
