import { checkStateFlags } from "../item-state/state-rules";
import { defaultStateTargets } from "./default-transitions";
import type {
  PipelinePhaseDraft,
  PipelineProblem,
  PipelineSetupDraft,
  PipelineTypeDraft,
} from "./schema";

export type ProblemInput = Pick<PipelineProblem, "code" | "message"> &
  Partial<Pick<PipelineProblem, "severity" | "phase" | "type" | "state">>;

/** A problem with the unset references as null; errors unless said otherwise. */
export const problem = ({ severity = "error", phase, type, state, ...rest }: ProblemInput) => ({
  ...rest,
  severity,
  phase: phase ?? null,
  type: type ?? null,
  state: state ?? null,
});

/** The names that occur more than once. */
export const duplicates = ({ names }: { names: readonly string[] }) => [
  ...new Set(names.filter((value, index) => names.indexOf(value) !== index)),
];

/** One entry phase, at least one terminal phase, no entry phase that is terminal (ADR 0043). */
export function phaseProblems({ phases }: { phases: readonly PipelinePhaseDraft[] }) {
  const found: PipelineProblem[] = duplicates({ names: phases.map((row) => row.name) }).map(
    (phase) => problem({ code: "DUPLICATE_NAME", message: "Two phases share a name", phase }),
  );
  const entries = phases.filter((row) => row.entry).length;
  if (entries === 0) found.push(problem({ code: "NO_ENTRY_PHASE", message: "No entry phase" }));
  if (entries > 1) {
    found.push(problem({ code: "MANY_ENTRY_PHASES", message: "More than one entry phase" }));
  }
  if (!phases.some((row) => row.terminal)) {
    found.push(problem({ code: "NO_TERMINAL_PHASE", message: "No terminal phase" }));
  }
  for (const row of phases.filter((candidate) => candidate.entry && candidate.terminal)) {
    const message = "A phase cannot be both the entry phase and terminal";
    found.push(problem({ code: "INVALID_PHASE_FLAGS", message, phase: row.name }));
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

/** Every cell names a non-terminal phase, a type and one of its states, once per phase and type. */
export function cellProblems({ draft }: CellProblemsInput): PipelineProblem[] {
  const keys = draft.cells.map((cell) => `${cell.phase}\u0000${cell.type}`);
  return draft.cells.flatMap((cell, index) => {
    const at = { phase: cell.phase, type: cell.type, state: cell.state };
    const phase = draft.phases.find((row) => row.name === cell.phase);
    const type = draft.itemTypes.find((row) => row.name === cell.type);
    if (!phase || !type?.states.some((row) => row.name === cell.state)) {
      const message = "The cell names an unknown phase, type or state";
      return [problem({ code: "UNKNOWN_CELL", message, ...at })];
    }
    if (phase.terminal) {
      const message = "A terminal phase releases every line and has no cells";
      return [problem({ code: "TERMINAL_CELL", message, ...at })];
    }
    if (keys.indexOf(keys[index] ?? "") !== index) {
      return [
        problem({ code: "DUPLICATE_NAME", message: "Two cells for one phase and type", ...at }),
      ];
    }
    return [];
  });
}
