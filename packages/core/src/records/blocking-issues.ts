import type { RecordBase, RecordMatches } from "@okazi/db";
import type { AppErrorIssue } from "../errors/app-error";
import { hasPermission, type Permission } from "../operations/permission";
import type { OperationContext } from "../operations/types";
import { conflict } from "../shared/errors";

/** The resource whose `read` permission guards a record base (feature scope, ADR 0050). */
const BASE_RESOURCE: Readonly<Record<RecordBase, string>> = {
  ITEM: "item",
  CUSTOMER: "customer",
  CONTACT: "contact",
  TICKET: "ticket",
  TICKET_TEMPLATE: "ticketTemplate",
  LINE: "line",
  REQUIREMENT: "requirement",
};

type Viewer = Pick<OperationContext, "permissions">;

export type BlockingIssuesInput = { context: Viewer; usage: RecordMatches };

/**
 * One issue per blocking record (`path` = `records.<id>`, message = its base and id). Only records
 * the caller may read are named; the rest, and those past the listed sample, are one count.
 */
export function blockingIssues({ context, usage }: BlockingIssuesInput): AppErrorIssue[] {
  const readable = usage.rows.filter(({ base }) => {
    const permission = `${BASE_RESOURCE[base]}:read` as Permission;
    return hasPermission({ permissions: context.permissions, permission });
  });
  const issues = readable.map(({ id, base }) => ({
    path: `records.${id}`,
    message: `${base} ${id}`,
  }));
  const unnamed = usage.total - readable.length;
  return unnamed > 0
    ? [...issues, { path: "records", message: `${unnamed} more records` }]
    : issues;
}

export type UsageConflictInput = BlockingIssuesInput & { message: string };

/** `CONFLICT` for a rule refused by records in use; `issues` lists the blocking records. */
export const usageConflict = ({ context, usage, message }: UsageConflictInput) =>
  conflict({ message, issues: blockingIssues({ context, usage }) });

export type MergeUsageInput = { usages: readonly RecordMatches[] };

/** Several usage results as one: totals add up, listed rows are concatenated. */
export const mergeUsage = ({ usages }: MergeUsageInput): RecordMatches => ({
  total: usages.reduce((sum, usage) => sum + usage.total, 0),
  rows: usages.flatMap((usage) => usage.rows),
});
