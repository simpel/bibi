import type { OperationContext } from "../../operations/types";
import { LINE_INCLUDE, toLineRecord } from "../line/to-line-record";
import { withEffective } from "../line/with-effective";

type Db = { context: Pick<OperationContext, "db" | "permissions"> };
export type DetailIds = { lineIds: string[]; ticketIds: string[] };

/** The lines with their effective quantity and price (ADR 0052), by id. */
async function loadLines({ context, lineIds }: Db & Pick<DetailIds, "lineIds">) {
  const rows = await context.db.line.findMany({
    where: { id: { in: lineIds } },
    include: LINE_INCLUDE,
  });
  const lines = await withEffective({ context, lines: rows.map((row) => toLineRecord({ row })) });
  return new Map(lines.map((line) => [line.id, line]));
}

function loadTickets({ context, ticketIds }: Db & Pick<DetailIds, "ticketIds">) {
  return context.db.ticket.findMany({
    where: { id: { in: ticketIds } },
    select: {
      ...{ id: true, estimatedHeadcount: true, guaranteedHeadcount: true },
      customer: { select: { name: true } },
      contact: { select: { name: true, phone: true, email: true } },
    },
  });
}

/** The main assignees of the lines and tickets (ADR 0055: stored choices only), with names. */
async function loadAssignees({ context, lineIds, ticketIds }: Db & DetailIds) {
  const rows = await context.db.assignment.findMany({
    where: {
      recordId: { in: [...lineIds, ...ticketIds] },
      responsibilityId: null,
      status: "ACTIVE",
      assigneeId: { not: null },
    },
    select: { recordId: true, assigneeId: true },
  });
  const userIds = [...new Set(rows.flatMap((row) => row.assigneeId ?? []))];
  const members = await context.db.member.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, user: { select: { name: true } } },
  });
  const names = new Map(members.map((member) => [member.userId, member.user.name]));
  return new Map(
    rows.flatMap(({ recordId, assigneeId }) => {
      const name = assigneeId ? names.get(assigneeId) : undefined;
      return assigneeId && name ? [[recordId, { userId: assigneeId, name }] as const] : [];
    }),
  );
}

function loadStaff({ context, lineIds }: Db & Pick<DetailIds, "lineIds">) {
  return context.db.lineAllocation.findMany({
    where: { lineId: { in: lineIds }, status: "ACTIVE", unitId: { not: null } },
    orderBy: [{ demandId: "asc" }, { slot: "asc" }],
    select: {
      lineId: true,
      unit: {
        select: {
          ...{ id: true, name: true },
          entityType: { select: { name: true } },
          memberProfileItem: { select: { id: true } },
        },
      },
    },
  });
}

/** Everything the blocks' details need, in a fixed number of queries for any number of blocks. */
export async function loadDetailSources({ context, lineIds, ticketIds }: Db & DetailIds) {
  const [lines, tickets, assignees, staff] = await Promise.all([
    loadLines({ context, lineIds }),
    loadTickets({ context, ticketIds }),
    loadAssignees({ context, lineIds, ticketIds }),
    loadStaff({ context, lineIds }),
  ]);
  return { lines, tickets: new Map(tickets.map((t) => [t.id, t])), assignees, staff };
}

export type DetailSources = Awaited<ReturnType<typeof loadDetailSources>>;
