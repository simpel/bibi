import type { Prisma, TicketPhase } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { TicketPhaseDto } from "./schema";

/** Prisma `include` that loads a phase's allowed targets (active ones, in phase order). */
export const WITH_TRANSITIONS = {
  transitionsFrom: {
    where: { toPhase: { status: "ACTIVE" } },
    select: { toPhaseId: true },
    orderBy: [{ toPhase: { position: "asc" } }, { toPhaseId: "asc" }],
  },
} satisfies Prisma.TicketPhaseInclude;

type Row = TicketPhase & { transitionsFrom: readonly { toPhaseId: string }[] };

export type ToTicketPhaseDtoInput = { row: Row };

export function toTicketPhaseDto({ row }: ToTicketPhaseDtoInput): TicketPhaseDto {
  const { transitionsFrom, ...phase } = row;
  return { ...phase, transitionsTo: transitionsFrom.map((target) => target.toPhaseId) };
}

export type LoadTicketPhaseInput = { context: Pick<OperationContext, "db">; id: string };

/** One active phase with its transitions, or `null`. */
export async function loadTicketPhase({
  context,
  id,
}: LoadTicketPhaseInput): Promise<TicketPhaseDto | null> {
  const row = await context.db.ticketPhase.findFirst({
    where: { id },
    include: WITH_TRANSITIONS,
  });
  return row ? toTicketPhaseDto({ row }) : null;
}

export type LoadAllInput = { context: Pick<OperationContext, "db"> };

/** Every active phase in order (an organization has a handful, never pages of them). */
export async function loadAllTicketPhases({ context }: LoadAllInput) {
  const rows = await context.db.ticketPhase.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_TRANSITIONS,
  });
  return rows.map((row) => toTicketPhaseDto({ row }));
}
