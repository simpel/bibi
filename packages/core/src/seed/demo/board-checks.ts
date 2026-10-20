import { pipelineBoard } from "../../features/pipeline/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoBoardInput = { context: ExecuteContext; org: DemoOrg };

type Card = { id: string; phaseChangedAt: Date };

type TimeInPhaseInput = CheckDemoBoardInput & { cards: readonly Card[] };

/** Every card's time in phase is its ticket's newest phase change (ADR 0054), not the audit log. */
async function timeInPhaseFailures({ context, org, cards }: TimeInPhaseInput) {
  const changes = await context.db.ticketPhaseChange.findMany({
    where: { ticketId: { in: cards.map((card) => card.id) } },
    select: { ticketId: true, changedAt: true },
    orderBy: { seq: "asc" },
  });
  const newest = new Map(changes.map((change) => [change.ticketId, change.changedAt.getTime()]));
  const off = cards.filter((card) => newest.get(card.id) !== card.phaseChangedAt.getTime());
  return off.length > 0 ? [`${org.slug}: ${off.length} cards with a wrong time in phase`] : [];
}

/**
 * ADR 0041, 0043: `pipeline.board` has one column per seeded phase, every seeded ticket is on
 * exactly one card (in its phase's column), the Closed lane shows the terminal tickets, and the
 * time in phase comes from the phase history (ADR 0054).
 */
export async function checkDemoBoard({ context, org }: CheckDemoBoardInput): Promise<string[]> {
  const result = await execute({ operation: pipelineBoard, input: {}, context });
  if (!result.ok) return [`${org.slug}: pipeline.board failed: ${result.error.message}`];
  const { columns, cards } = result.value;
  const failures: string[] = [];
  const phases = await context.db.ticketPhase.findMany({ select: { id: true, name: true } });
  if (columns.length !== phases.length) {
    failures.push(`${org.slug}: ${columns.length} board columns, expected ${phases.length}`);
  }
  if (cards.length !== org.tickets.length) {
    failures.push(`${org.slug}: ${cards.length} board cards, expected ${org.tickets.length}`);
  }
  const ids = new Set(cards.map((card) => card.id));
  if (ids.size !== cards.length) failures.push(`${org.slug}: a ticket is on two cards`);
  const known = new Set(columns.map((column) => column.id));
  if (cards.some((card) => !known.has(card.columnId))) {
    failures.push(`${org.slug}: a card is in no column`);
  }
  return [...failures, ...(await timeInPhaseFailures({ context, org, cards }))];
}
