import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { subjectIdFilter } from "../assignment/subject-filter";
import { LATEST_STATUS_CHANGE } from "../ticket/status-history";
import type { PipelineBoardInput, PipelineCard } from "./schema";

/** Upper bound of cards, so one board response stays small. */
const CARD_LIMIT = 500;

type Db = Pick<OperationContext, "db">;
export type LoadCardsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  input: PipelineBoardInput;
  since: Date;
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

export async function loadTicketCards({
  context,
  input,
  since,
}: LoadCardsInput): Promise<PipelineCard[]> {
  const { assigneeId, entityTypeId } = input;
  const ids = await subjectIdFilter({ context, subjectType: "TICKET", assigneeId });
  const rows = await context.db.ticket.findMany({
    where: {
      ...ids,
      ...(entityTypeId ? { entityTypeId } : {}),
      OR: openOrRecentlyClosed({ since }),
    },
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
    columnId: row.statusId,
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
