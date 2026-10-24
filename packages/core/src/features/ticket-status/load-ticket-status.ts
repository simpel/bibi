import type { Prisma, TicketStatus } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { TicketStatusDto } from "./schema";

/** Prisma `include` that loads a status's allowed targets (active ones, in status order). */
export const WITH_TRANSITIONS = {
  transitionsFrom: {
    where: { toStatus: { status: "ACTIVE" } },
    select: { toStatusId: true },
    orderBy: [{ toStatus: { position: "asc" } }, { toStatusId: "asc" }],
  },
} satisfies Prisma.TicketStatusInclude;

type Row = TicketStatus & { transitionsFrom: readonly { toStatusId: string }[] };

export type ToTicketStatusDtoInput = { row: Row };

export function toTicketStatusDto({ row }: ToTicketStatusDtoInput): TicketStatusDto {
  const { transitionsFrom, ...ticketStatus } = row;
  return { ...ticketStatus, transitionsTo: transitionsFrom.map((target) => target.toStatusId) };
}

export type LoadTicketStatusInput = { context: Pick<OperationContext, "db">; id: string };

/** One active status with its transitions, or `null`. */
export async function loadTicketStatus({
  context,
  id,
}: LoadTicketStatusInput): Promise<TicketStatusDto | null> {
  const row = await context.db.ticketStatus.findFirst({
    where: { id },
    include: WITH_TRANSITIONS,
  });
  return row ? toTicketStatusDto({ row }) : null;
}

export type LoadAllInput = { context: Pick<OperationContext, "db"> };

/** Every active status in order (an organization has a handful, never pages of them). */
export async function loadAllTicketStatuses({ context }: LoadAllInput) {
  const rows = await context.db.ticketStatus.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_TRANSITIONS,
  });
  return rows.map((row) => toTicketStatusDto({ row }));
}
