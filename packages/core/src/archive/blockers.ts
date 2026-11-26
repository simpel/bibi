import type { OperationContext } from "../operations/types";
import type { Feature } from "../permissions/features";
import { canView } from "../shared/can-view";
import { conflict } from "../shared/errors";
import { STILL_IN_USE } from "../shared/in-use";
import type { Blocker } from "./lifecycle-kind";

export type CountBlockerInput = {
  count: number | Promise<number>;
  feature: Feature;
  path: string;
  /** What refers to it, plural, e.g. `orders`. */
  what: string;
};

/** A blocker when `count` records still refer to it, else none. */
export async function countBlocker({
  count,
  feature,
  path,
  what,
}: CountBlockerInput): Promise<Blocker[]> {
  const n = await count;
  return n > 0 ? [{ feature, path, message: `Still used by ${n} ${what}` }] : [];
}

export type ArchivedParentInput = {
  /** The parent's status, or null when it has none. */
  status: string | null | undefined;
  feature: Feature;
  path: string;
  what: string;
};

/** A blocker when a record it needs is archived (restore that first). */
export function archivedParent({ status, feature, path, what }: ArchivedParentInput): Blocker[] {
  return status === "ARCHIVED" ? [{ feature, path, message: `Restore its ${what} first` }] : [];
}

/** Collects the blockers of several checks, in order. */
export async function allBlockers({
  checks,
}: {
  checks: readonly (Blocker[] | Promise<Blocker[]>)[];
}): Promise<Blocker[]> {
  return (await Promise.all(checks)).flat();
}

export type BlockedConflictInput = {
  context: Pick<OperationContext, "permissions">;
  message: string;
  blockers: readonly Blocker[];
};

/**
 * CONFLICT naming every blocker as an issue; a blocker of a feature the caller may not view says
 * only "It is still in use", so the error never describes records the caller cannot see.
 */
export function blockedConflict({ context, message, blockers }: BlockedConflictInput) {
  const issues = blockers.map(({ feature, path, message: detail }) => ({
    path,
    message: canView({ context, feature }) ? detail : STILL_IN_USE,
  }));
  const named = issues.map((issue) => issue.message).join("; ");
  return conflict({ message: `${message}: ${named}`, issues });
}
