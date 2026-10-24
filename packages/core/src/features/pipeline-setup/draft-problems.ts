import { checkStateFlags } from "../item-state/state-rules";
import { defaultStateTargets } from "./default-transitions";
import type {
  PipelineProblem,
  PipelineSetupDraft,
  PipelineStatusDraft,
  PipelineTypeDraft,
} from "./schema";

export type ProblemInput = Pick<PipelineProblem, "code" | "message"> &
  Partial<Pick<PipelineProblem, "severity" | "ticketStatus" | "type" | "state">>;

/** A problem with the unset references as null; errors unless said otherwise. */
export const problem = ({
  severity = "error",
  ticketStatus,
  type,
  state,
  ...rest
}: ProblemInput) => ({
  ...rest,
  severity,
  ticketStatus: ticketStatus ?? null,
  type: type ?? null,
  state: state ?? null,
});

/** The names that occur more than once. */
export const duplicates = ({ names }: { names: readonly string[] }) => [
  ...new Set(names.filter((value, index) => names.indexOf(value) !== index)),
];

/** One entry status, at least one closing status, no entry status that is closing (ADR 0043). */
export function statusProblems({ statuses }: { statuses: readonly PipelineStatusDraft[] }) {
  const found: PipelineProblem[] = duplicates({ names: statuses.map((row) => row.name) }).map(
    (ticketStatus) =>
      problem({ code: "DUPLICATE_NAME", message: "Two statuses share a name", ticketStatus }),
  );
  const entries = statuses.filter((row) => row.entry).length;
  if (entries === 0) found.push(problem({ code: "NO_ENTRY_STATUS", message: "No entry status" }));
  if (entries > 1) {
    found.push(problem({ code: "MANY_ENTRY_STATUSES", message: "More than one entry status" }));
  }
  if (!statuses.some((row) => row.closes)) {
    found.push(problem({ code: "NO_CLOSING_STATUS", message: "No closing status" }));
  }
  for (const row of statuses.filter((candidate) => candidate.entry && candidate.closes)) {
    const message = "A status cannot be both the entry status and closing";
    found.push(problem({ code: "INVALID_STATUS_FLAGS", message, ticketStatus: row.name }));
  }
  return found;
}

export type TypeProblemsInput = { draft: PipelineTypeDraft; bookable: boolean };

/** Flags that contradict each other or the type, and states nothing can leave (a warning). */
function stateProblems({ draft, bookable }: TypeProblemsInput): PipelineProblem[] {
  const type = draft.name;
  const { states } = draft;
  return states.flatMap((row) => {
    const found: PipelineProblem[] = [];
    const flags = { initial: false, inSheets: false, released: false, expires: false, ...row };
    const checked = checkStateFlags({ flags: { ...flags, hold: row.hold ?? "NONE" }, bookable });
    if (!checked.ok) {
      const { message } = checked.error;
      found.push(problem({ code: "INVALID_STATE_FLAGS", message, type, state: row.name }));
    }
    if (!row.released && defaultStateTargets({ states, from: row.name }).length === 0) {
      const message = "Nothing can leave this state";
      const at = { type, state: row.name, severity: "warning" as const };
      found.push(problem({ code: "STATE_CANNOT_LEAVE", message, ...at }));
    }
    return found;
  });
}

/** One initial state, valid flags, a known expiry state and no state nothing can leave. */
export function typeProblems({ draft, bookable }: TypeProblemsInput): PipelineProblem[] {
  const type = draft.name;
  const { states } = draft;
  const found = duplicates({ names: states.map((row) => row.name) }).map((state) =>
    problem({ code: "DUPLICATE_NAME", message: "Two states share a name", type, state }),
  );
  const initials = states.filter((row) => row.initial).length;
  if (initials === 0) {
    found.push(problem({ code: "NO_INITIAL_STATE", message: "No initial state", type }));
  }
  if (initials > 1) {
    const message = "More than one initial state";
    found.push(problem({ code: "MANY_INITIAL_STATES", message, type }));
  }
  found.push(...stateProblems({ draft, bookable }));
  const expiry = draft.expiryState;
  if (expiry && !states.some((row) => row.name === expiry)) {
    const message = "The expiry state is not a state of the type";
    found.push(problem({ code: "UNKNOWN_EXPIRY_STATE", message, type, state: expiry }));
  }
  return found;
}

export type CellProblemsInput = { draft: PipelineSetupDraft };

/** Every cell names a non-closing status, a type and one of its states, once per status and type. */
export function cellProblems({ draft }: CellProblemsInput): PipelineProblem[] {
  const keys = draft.cells.map((cell) => `${cell.ticketStatus}\u0000${cell.type}`);
  return draft.cells.flatMap((cell, index) => {
    const at = { ticketStatus: cell.ticketStatus, type: cell.type, state: cell.state };
    const ticketStatus = draft.statuses.find((row) => row.name === cell.ticketStatus);
    const type = draft.itemTypes.find((row) => row.name === cell.type);
    if (!ticketStatus || !type?.states.some((row) => row.name === cell.state)) {
      const message = "The cell names an unknown status, type or state";
      return [problem({ code: "UNKNOWN_CELL", message, ...at })];
    }
    if (ticketStatus.closes) {
      const message = "A closing status releases every line and has no cells";
      return [problem({ code: "CLOSING_CELL", message, ...at })];
    }
    if (keys.indexOf(keys[index] ?? "") !== index) {
      return [
        problem({ code: "DUPLICATE_NAME", message: "Two cells for one status and type", ...at }),
      ];
    }
    return [];
  });
}
