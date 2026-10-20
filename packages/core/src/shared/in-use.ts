import type { AppErrorIssue } from "../errors/app-error";
import type { OperationContext } from "../operations/types";
import type { Feature } from "../permissions/features";
import { canView } from "./can-view";
import { conflict } from "./errors";

/** What a caller who may not view the blocking records is told (ADR 0050, feature scope). */
export const STILL_IN_USE = "It is still in use";

export type InUseConflictInput = {
  context: Pick<OperationContext, "permissions">;
  /** The feature that owns the blocking records. */
  feature: Feature;
  /** The detailed message, naming how many of them block. */
  message: string;
  issues?: readonly AppErrorIssue[];
};

/**
 * CONFLICT for a change blocked by another feature's records: the detailed message (with its
 * count) only when the caller may view that feature, otherwise a neutral "It is still in use",
 * so an error never describes records the caller cannot view.
 */
export function inUseConflict({ context, feature, message, issues = [] }: InUseConflictInput) {
  if (canView({ context, feature })) return conflict({ message, issues });
  return conflict({
    message: STILL_IN_USE,
    issues: issues.map(({ path }) => ({ path, message: STILL_IN_USE })),
  });
}
