import { listBoards } from "../../features/board/operations";
import { pipelineBoard } from "../../features/pipeline/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoBoardLayoutInput = { context: ExecuteContext; org: DemoOrg };

type Board = { id: string; name: string; phases: { id: string; statusIds: string[] }[] };

/** Closed orders of the whole seed fall inside the retention window of this many days. */
const CLOSED_WITHIN_DAYS = 365;

/** One board's shape: a status in at most one phase, and every order in the right column. */
async function boardFailures({
  context,
  org,
  board,
}: CheckDemoBoardLayoutInput & { board: Board }) {
  const label = `${org.slug}: board ${board.name}`;
  const failures: string[] = [];
  const phaseOf = new Map<string, string>();
  for (const phase of board.phases) {
    for (const statusId of phase.statusIds) {
      if (phaseOf.has(statusId)) failures.push(`${label}: a status is in two phases`);
      phaseOf.set(statusId, phase.id);
    }
  }
  const input = { boardId: board.id, closedWithinDays: CLOSED_WITHIN_DAYS };
  const result = await execute({ operation: pipelineBoard, input, context });
  if (!result.ok) return [...failures, `${label}: pipeline.board failed: ${result.error.message}`];
  const orders = await context.db.order.findMany({ select: { id: true, statusId: true } });
  const shown = orders.filter((order) => phaseOf.has(order.statusId));
  const { cards, unmappedCount } = result.value;
  const column = new Map(cards.map((card) => [card.id, card.columnId]));
  if (column.size !== cards.length) failures.push(`${label}: an order is on two cards`);
  const wrong = shown.filter((order) => column.get(order.id) !== phaseOf.get(order.statusId));
  if (wrong.length > 0) failures.push(`${label}: ${wrong.length} orders not in their column`);
  if (cards.length !== shown.length) {
    failures.push(`${label}: ${cards.length} cards, expected ${shown.length}`);
  }
  const off = orders.length - shown.length;
  if (unmappedCount !== off) failures.push(`${label}: ${unmappedCount} unmapped, expected ${off}`);
  return failures;
}

/**
 * ADR 0067: the boards and phases match the data files (the default board has a phase per
 * status, `pipeline.boards` add theirs), every status is in at most one phase per board, and every
 * seeded order shows in exactly one column of each board that has a phase for its status.
 */
export async function checkDemoBoardLayout({
  context,
  org,
}: CheckDemoBoardLayoutInput): Promise<string[]> {
  const listed = await execute({ operation: listBoards, input: { limit: 100 }, context });
  if (!listed.ok) return [`${org.slug}: board.list failed: ${listed.error.message}`];
  const boards = listed.value.items;
  const extra = org.pipeline.boards ?? [];
  const failures: string[] = [];
  const expected = 1 + extra.length;
  if (boards.length !== expected) {
    failures.push(`${org.slug}: ${boards.length} boards, expected ${expected}`);
  }
  const phases = boards.reduce((sum, board) => sum + board.phases.length, 0);
  const expectedPhases =
    org.pipeline.statuses.statuses.length +
    extra.reduce((sum, board) => sum + board.phases.length, 0);
  if (phases !== expectedPhases) {
    failures.push(`${org.slug}: ${phases} board phases, expected ${expectedPhases}`);
  }
  for (const board of boards) failures.push(...(await boardFailures({ context, org, board })));
  return failures;
}
