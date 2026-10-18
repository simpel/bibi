import type { AssignmentSubjectType, Prisma } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { subjectIdFilter } from "../assignment/subject-filter";
import { bookingColumnId, inquiryColumnId } from "./columns";
import type { PipelineBoardInput, PipelineCard } from "./schema";

/** Upper bound per kind, so one board response stays small. */
const CARD_LIMIT = 500;

type Db = Pick<OperationContext, "db">;
export type LoadCardsInput = { context: Db; input: PipelineBoardInput; since: Date };

type MainAssigneesInput = { context: Db; subjectType: AssignmentSubjectType; ids: string[] };

async function mainAssignees({ context, subjectType, ids }: MainAssigneesInput) {
  const rows = await context.db.assignment.findMany({
    where: { subjectType, subjectId: { in: ids }, responsibilityId: null },
    select: { subjectId: true, assigneeId: true },
  });
  return new Map(rows.map((row) => [row.subjectId, row.assigneeId]));
}

export async function loadInquiryCards({
  context,
  input,
  since,
}: LoadCardsInput): Promise<PipelineCard[]> {
  const { assigneeId, entityTypeId } = input;
  const ids = await subjectIdFilter({ context, subjectType: "INQUIRY", assigneeId });
  const rows = await context.db.inquiry.findMany({
    where: {
      ...ids,
      ...(entityTypeId ? { entityTypeId } : {}),
      OR: [
        { inquiryStatus: { in: ["NEW", "QUALIFIED", "QUOTED"] } },
        { inquiryStatus: "LOST", statusChangedAt: { gte: since } },
      ],
    },
    include: { customer: { select: { name: true } }, entityType: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: CARD_LIMIT,
  });
  const owners = await mainAssignees({
    context,
    subjectType: "INQUIRY",
    ids: rows.map((row) => row.id),
  });
  return rows.map((row) => ({
    id: row.id,
    kind: "INQUIRY",
    columnId: inquiryColumnId({ id: row.inquiryStatus }),
    reference: null,
    typeName: row.entityType.name,
    customerName: row.customer.name,
    startsAt: row.desiredStartsAt,
    endsAt: row.desiredEndsAt,
    quantity: row.quantity,
    assigneeId: owners.get(row.id) ?? null,
  }));
}

type BoardWhereInput = {
  ids: { id?: { in: string[] } };
  entityTypeId?: string | undefined;
  since: Date;
};

/** Open bookings, plus completed and cancelled ones changed since `since`. */
function bookingBoardWhere({
  ids,
  entityTypeId,
  since,
}: BoardWhereInput): Prisma.BookingWhereInput {
  return {
    ...ids,
    ...(entityTypeId ? { entityTypeId } : {}),
    OR: [
      { bookingStatus: { phase: { in: ["TENTATIVE", "CONFIRMED"] } } },
      {
        bookingStatus: { phase: { in: ["COMPLETED", "CANCELLED"] } },
        statusChangedAt: { gte: since },
      },
    ],
  };
}

export async function loadBookingCards({
  context,
  input,
  since,
}: LoadCardsInput): Promise<PipelineCard[]> {
  const { assigneeId, entityTypeId } = input;
  const ids = await subjectIdFilter({ context, subjectType: "BOOKING", assigneeId });
  const rows = await context.db.booking.findMany({
    where: bookingBoardWhere({ ids, entityTypeId, since }),
    include: { customer: { select: { name: true } }, entityType: { select: { name: true } } },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    take: CARD_LIMIT,
  });
  const owners = await mainAssignees({
    context,
    subjectType: "BOOKING",
    ids: rows.map((row) => row.id),
  });
  return rows.map((row) => ({
    id: row.id,
    kind: "BOOKING",
    columnId: bookingColumnId({ id: row.bookingStatusId }),
    reference: row.reference,
    typeName: row.entityType.name,
    customerName: row.customer.name,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    quantity: row.guaranteedHeadcount ?? row.estimatedHeadcount,
    assigneeId: owners.get(row.id) ?? null,
  }));
}
