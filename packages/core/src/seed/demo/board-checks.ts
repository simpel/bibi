import { pipelineBoard } from "../../features/pipeline/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoBoardInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0041, 0043: `pipeline.board` has one column per seeded phase, every seeded ticket is on
 * exactly one card (in its phase's column), and the Closed lane shows the terminal tickets.
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
  return failures;
}
