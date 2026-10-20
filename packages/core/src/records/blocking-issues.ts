import type { RecordBase, RecordMatches } from "@okazi/db";
import type { AppErrorIssue } from "../errors/app-error";
import type { OperationContext } from "../operations/types";
import type { Feature } from "../permissions/features";
import { canView } from "../shared/can-view";
import { conflict } from "../shared/errors";
import { STILL_IN_USE } from "../shared/in-use";

/** The feature whose `read` permission guards a record base (feature scope, ADR 0050). */
export const BASE_FEATURE: Readonly<Record<RecordBase, Feature>> = {
  ITEM: "item",
  CUSTOMER: "customer",
  CONTACT: "customer",
  TICKET: "ticket",
  TICKET_TEMPLATE: "template",
  LINE: "program",
  REQUIREMENT: "program",
};

type Viewer = Pick<OperationContext, "permissions">;

export type BlockingIssuesInput = { context: Viewer; usage: RecordMatches };

const readableRows = ({ context, usage }: BlockingIssuesInput) =>
  usage.rows.filter(({ base }) => canView({ context, feature: BASE_FEATURE[base] }));

/** Whether the caller may view every blocking record, listed or not. */
function seesAll({ context, usage }: BlockingIssuesInput): boolean {
  if (readableRows({ context, usage }).length < usage.rows.length) return false;
  if (usage.total === usage.rows.length) return true;
  const features = Object.values(BASE_FEATURE);
  return features.every((feature) => canView({ context, feature }));
}

/**
 * One issue per blocking record (`path` = `records.<id>`, message = its base and id). Only records
 * the caller may read are named; those past the listed sample are one count.
 */
export function blockingIssues({ context, usage }: BlockingIssuesInput): AppErrorIssue[] {
  const issues = readableRows({ context, usage }).map(({ id, base }) => ({
    path: `records.${id}`,
    message: `${base} ${id}`,
  }));
  const unnamed = usage.total - issues.length;
  return unnamed > 0
    ? [...issues, { path: "records", message: `${unnamed} more records` }]
    : issues;
}

export type UsageConflictInput = BlockingIssuesInput & { message: string };

/**
 * `CONFLICT` for a rule refused by records in use; `issues` lists the blocking records. A caller
 * who may not view all of them gets the neutral "It is still in use" with only the records it
 * may view, so an error never describes or counts records it cannot view (ADR 0050).
 */
export function usageConflict({ context, usage, message }: UsageConflictInput) {
  if (seesAll({ context, usage })) {
    return conflict({ message, issues: blockingIssues({ context, usage }) });
  }
  const issues = readableRows({ context, usage }).map(({ id }) => ({
    path: `records.${id}`,
    message: STILL_IN_USE,
  }));
  return conflict({ message: STILL_IN_USE, issues });
}

export type MergeUsageInput = { usages: readonly RecordMatches[] };

/** Several usage results as one: totals add up, listed rows are concatenated. */
export const mergeUsage = ({ usages }: MergeUsageInput): RecordMatches => ({
  total: usages.reduce((sum, usage) => sum + usage.total, 0),
  rows: usages.flatMap((usage) => usage.rows),
});
