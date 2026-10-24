import { canMoveState } from "./default-transitions";
import { problem } from "./draft-problems";
import type {
  PipelinePreviewLine,
  PipelinePreviewStep,
  PipelineProblem,
  PipelineSetupDraft,
  PipelineStateDraft,
  PipelineStatusDraft,
  PipelineTypeDraft,
} from "./schema";

export type SimulateInput = {
  draft: PipelineSetupDraft;
  /** Item type name → whether the type has `BOOKABLE`. */
  bookable: ReadonlyMap<string, boolean>;
};

type Walk = SimulateInput & { problems: PipelineProblem[] };

type LineInput = Walk & { type: PipelineTypeDraft; state: PipelineStateDraft | undefined };

/** A line of the type in the state, holding only when the type is bookable. */
function line({ bookable, type, state }: LineInput): PipelinePreviewLine {
  const hold = state && bookable.get(type.name) ? (state.hold ?? "NONE") : "NONE";
  const released = state?.released === true;
  return {
    ...{ type: type.name, state: state?.name ?? null, color: state?.color ?? null },
    ...{ hold: released ? "NONE" : hold, released, changed: false, blocked: null },
  };
}

type CellInput = Walk & { ticketStatus: PipelineStatusDraft; type: PipelineTypeDraft };

/** The state the status's cell moves the type's lines to; undefined for "keep". */
function cellState({ draft, ticketStatus, type }: CellInput) {
  const cell = draft.cells.find(
    (row) => row.ticketStatus === ticketStatus.name && row.type === type.name,
  );
  return cell ? type.states.find((state) => state.name === cell.state) : undefined;
}

type EnterInput = Walk & { ticketStatus: PipelineStatusDraft; lines: PipelinePreviewLine[] };

/**
 * The ticket enters an open status (ADR 0044): each line moves to its cell's state when the
 * type's transitions allow it; otherwise it keeps its state and the move is a blocker.
 */
function enter({ ...input }: EnterInput): PipelinePreviewLine[] {
  return input.draft.itemTypes.map((type, index) => {
    const now = input.lines[index] ?? line({ ...input, type, state: undefined });
    const target = cellState({ ...input, type });
    if (!target || target.name === now.state) return { ...now, changed: false, blocked: null };
    const { states } = type;
    if (now.state === null || canMoveState({ states, from: now.state, to: target.name })) {
      return { ...line({ ...input, type, state: target }), changed: true };
    }
    const message = `A line cannot move from ${now.state} to ${target.name}`;
    const at = { ticketStatus: input.ticketStatus.name, type: type.name, state: target.name };
    input.problems.push(problem({ code: "LINE_BLOCKED", message, ...at }));
    return { ...now, changed: false, blocked: message };
  });
}

/** A closing status releases every line: the type's first released state, or no hold. */
function release({
  draft,
  lines,
  ...walk
}: Omit<EnterInput, "ticketStatus">): PipelinePreviewLine[] {
  return draft.itemTypes.map((type, index) => {
    const now = lines[index] ?? line({ ...walk, draft, type, state: undefined });
    const state = type.states.find((row) => row.released);
    if (!state) return { ...now, hold: "NONE", released: true, changed: false, blocked: null };
    const moved = state.name !== now.state;
    return { ...line({ ...walk, draft, type, state }), changed: moved };
  });
}

/** The first lines: each type's cell for the entry status or its initial (else first) state. */
function start({
  ticketStatus,
  ...walk
}: Walk & { ticketStatus: PipelineStatusDraft | undefined }) {
  return walk.draft.itemTypes.map((type) => {
    const initial = type.states.find((row) => row.initial) ?? type.states[0];
    const state = (ticketStatus && cellState({ ...walk, ticketStatus, type })) || initial;
    return line({ ...walk, type, state });
  });
}

const step = ({
  ticketStatus,
  lines,
}: {
  ticketStatus: PipelineStatusDraft;
  lines: PipelinePreviewLine[];
}) => ({
  ...{
    ticketStatus: ticketStatus.name,
    color: ticketStatus.color,
    closes: ticketStatus.closes === true,
  },
  lines,
});

/**
 * Steps a simulated ticket with one line per item type through the draft: from the entry status
 * through every later open status, then into each closing status from the last open one.
 */
export function simulate({ ...input }: SimulateInput) {
  const problems: PipelineProblem[] = [];
  const walk = { ...input, problems };
  const { statuses } = input.draft;
  const open = statuses.filter((ticketStatus) => !ticketStatus.closes);
  const from = Math.max(
    0,
    open.findIndex((ticketStatus) => ticketStatus.entry),
  );
  const path = open.slice(from);
  let lines = start({ ...walk, ticketStatus: path[0] });
  const steps: PipelinePreviewStep[] = [];
  for (const [index, ticketStatus] of path.entries()) {
    if (index > 0) lines = enter({ ...walk, ticketStatus, lines });
    steps.push(step({ ticketStatus, lines }));
  }
  for (const ticketStatus of statuses.filter((candidate) => candidate.closes)) {
    steps.push(step({ ticketStatus, lines: release({ ...walk, lines }) }));
  }
  return { steps, problems };
}
