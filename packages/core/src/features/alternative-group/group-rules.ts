import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { hardStateIds } from "./hard-hold";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckOptionsInput = Db & {
  ticketId: string;
  lineIds: readonly string[];
  /** The group being changed; its own options may stay in it. */
  groupId?: string;
};

type OptionRow = { id: string; ticketId: string; alternativeGroupId: string | null };

function optionIssue({ row, at, ticketId, groupId }: { row?: OptionRow; at: number } & CheckIds) {
  const path = `lineIds.${at}`;
  if (!row) return { path, message: "Unknown line" };
  if (row.ticketId !== ticketId) return { path, message: "The line belongs to another ticket" };
  if (row.alternativeGroupId && row.alternativeGroupId !== groupId) {
    return { path, message: "The line is already an option of another alternative group" };
  }
  return null;
}

type CheckIds = { ticketId: string; groupId?: string | undefined };

/**
 * The options of a group (ADR 0052): distinct active lines of the ticket, none an option of
 * another group, and at most one of them in a hard-hold state. `VALIDATION` with one issue per
 * offending `lineIds.N` otherwise.
 */
export async function checkOptions({
  context,
  ticketId,
  lineIds,
  groupId,
}: CheckOptionsInput): Promise<Result<true>> {
  const rows = await context.db.line.findMany({
    where: { id: { in: [...lineIds] } },
    select: { id: true, ticketId: true, alternativeGroupId: true, stateId: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const issues: AppErrorIssue[] = [];
  for (const [at, id] of lineIds.entries()) {
    const duplicate = lineIds.indexOf(id) !== at;
    const issue = duplicate
      ? { path: `lineIds.${at}`, message: "The line is listed twice" }
      : optionIssue({ row: byId.get(id), at, ticketId, groupId });
    if (issue) issues.push(issue);
  }
  const states = rows.flatMap((row) => (row.stateId ? [row.stateId] : []));
  const hard = await hardStateIds({ context, ids: states });
  if (rows.filter((row) => row.stateId && hard.has(row.stateId)).length > 1) {
    issues.push({ path: "lineIds", message: "At most one option may be in a hard-hold state" });
  }
  if (issues.length === 0) return ok({ value: true });
  const message = issues[0]?.message ?? "Invalid options";
  return invalid({ message, issues });
}
