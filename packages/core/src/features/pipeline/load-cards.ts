import type { OperationContext } from "../../operations/types";
import { subjectIdFilter } from "../assignment/subject-filter";
import type { PipelineBoardInput, PipelineCard } from "./schema";

/** Upper bound of cards, so one board response stays small. */
const CARD_LIMIT = 500;

type Db = Pick<OperationContext, "db">;
export type LoadCardsInput = { context: Db; input: PipelineBoardInput; since: Date };

async function mainAssignees({ context, ids }: { context: Db; ids: string[] }) {
  const rows = await context.db.assignment.findMany({
    where: { subjectType: "TICKET", subjectId: { in: ids }, responsibilityId: null },
    select: { subjectId: true, assigneeId: true },
  });
  return new Map(rows.map((row) => [row.subjectId, row.assigneeId]));
}

/** Tickets in open phases, plus those that entered a terminal phase since `since`. */
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
      OR: [
        { phase: { terminal: false } },
        { phase: { terminal: true }, phaseChangedAt: { gte: since } },
      ],
    },
    include: { customer: { select: { name: true } }, entityType: { select: { name: true } } },
    orderBy: [{ reference: "desc" }, { id: "desc" }],
    take: CARD_LIMIT,
  });
  const owners = await mainAssignees({ context, ids: rows.map((row) => row.id) });
  return rows.map((row) => ({
    id: row.id,
    columnId: row.phaseId,
    reference: row.reference,
    typeName: row.entityType.name,
    customerName: row.customer.name,
    startsAt: row.desiredStartsAt,
    endsAt: row.desiredEndsAt,
    quantity: row.guaranteedHeadcount ?? row.estimatedHeadcount ?? row.quantity,
    phaseChangedAt: row.phaseChangedAt,
    assigneeId: owners.get(row.id) ?? null,
  }));
}
