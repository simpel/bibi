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

type CellInput = Walk & { orderStatus: PipelineStatusDraft; type: PipelineTypeDraft };

/** The state the status's cell moves the type's lines to; undefined for "keep". */
function cellState({ draft, orderStatus, type }: CellInput) {
  const cell = draft.cells.find(
    (row) => row.orderStatus === orderStatus.name && row.type === type.name,
  );
  return cell ? type.states.find((state) => state.name === cell.state) : undefined;
}

type EnterInput = Walk & { orderStatus: PipelineStatusDraft; lines: PipelinePreviewLine[] };

/**
 * The order enters an open status (ADR 0044): each line moves to its cell's state when the
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
    const at = { orderStatus: input.orderStatus.name, type: type.name, state: target.name };
    input.problems.push(problem({ code: "LINE_BLOCKED", message, ...at }));
    return { ...now, changed: false, blocked: message };
  });
}

/** A closing status releases every line: the type's first released state, or no hold. */
function release({
  draft,
  lines,
  ...walk
}: Omit<EnterInput, "orderStatus">): PipelinePreviewLine[] {
  return draft.itemTypes.map((type, index) => {
    const now = lines[index] ?? line({ ...walk, draft, type, state: undefined });
    const state = type.states.find((row) => row.released);
    if (!state) return { ...now, hold: "NONE", released: true, changed: false, blocked: null };
    const moved = state.name !== now.state;
    return { ...line({ ...walk, draft, type, state }), changed: moved };
  });
}

/** The first lines: each type's cell for the entry status or its initial (else first) state. */
function start({ orderStatus, ...walk }: Walk & { orderStatus: PipelineStatusDraft | undefined }) {
  return walk.draft.itemTypes.map((type) => {
    const initial = type.states.find((row) => row.initial) ?? type.states[0];
    const state = (orderStatus && cellState({ ...walk, orderStatus, type })) || initial;
    return line({ ...walk, type, state });
  });
}

const step = ({
  orderStatus,
  lines,
}: {
  orderStatus: PipelineStatusDraft;
  lines: PipelinePreviewLine[];
}) => ({
  ...{
    orderStatus: orderStatus.name,
    color: orderStatus.color,
    closes: orderStatus.closes === true,
  },
  lines,
});

/**
 * Steps a simulated order with one line per item type through the draft: from the entry status
 * through every later open status, then into each closing status from the last open one.
 */
export function simulate({ ...input }: SimulateInput) {
  const problems: PipelineProblem[] = [];
  const walk = { ...input, problems };
  const { statuses } = input.draft;
  const open = statuses.filter((orderStatus) => !orderStatus.closes);
  const from = Math.max(
    0,
    open.findIndex((orderStatus) => orderStatus.entry),
  );
  const path = open.slice(from);
  let lines = start({ ...walk, orderStatus: path[0] });
  const steps: PipelinePreviewStep[] = [];
  for (const [index, orderStatus] of path.entries()) {
    if (index > 0) lines = enter({ ...walk, orderStatus, lines });
    steps.push(step({ orderStatus, lines }));
  }
  for (const orderStatus of statuses.filter((candidate) => candidate.closes)) {
    steps.push(step({ orderStatus, lines: release({ ...walk, lines }) }));
  }
  return { steps, problems };
}
