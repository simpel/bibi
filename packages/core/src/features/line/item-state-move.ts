import type { OperationContext } from "../../operations/types";
import { recordStateChange } from "./state-history";
import { LINE_INCLUDE } from "./to-line-record";

type Db = { context: Pick<OperationContext, "db"> };

export type StateFirstInput = Db & { fromStateId: string | null; toStateId: string | null };

/**
 * Whether the state changes before the item does. Each step re-derives the hold by trigger (ADR
 * 0053), so the step in between must not take a hard hold the line has at neither end: the state
 * goes first unless it is the one that becomes hard.
 */
async function stateFirst({ context, fromStateId, toStateId }: StateFirstInput) {
  if (!toStateId) return true;
  const ids = [toStateId, ...(fromStateId ? [fromStateId] : [])];
  const states = await context.db.itemState.findMany({
    where: { id: { in: ids }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { id: true, hold: true },
  });
  const hard = ({ id }: { id: string | null }) =>
    states.some((state) => state.id === id && state.hold === "HARD");
  return !hard({ id: toStateId }) || hard({ id: fromStateId });
}

export type MoveWithStateInput = {
  context: OperationContext;
  lineId: string;
  fromStateId: string | null;
  /** The state the move gives the line; null when its state stays. */
  state: { stateId: string | null } | null;
  /** Writes the line's own columns (item, setup, time, …), never its state. */
  write: () => Promise<unknown>;
};

/**
 * Updates a line and, when it moves to an item of another type, records its new state (trigger
 * `SYSTEM`, ADR 0054) in the order `stateFirst` picks. Returns the line as it is afterwards.
 */
export async function moveWithState({
  context,
  lineId,
  fromStateId,
  state,
  write,
}: MoveWithStateInput) {
  const record = async () => {
    if (!state) return;
    const toStateId = state.stateId;
    await recordStateChange({ context, lineId, fromStateId, toStateId, trigger: "SYSTEM" });
  };
  const toStateId = state?.stateId ?? null;
  if (state && (await stateFirst({ context, fromStateId, toStateId }))) {
    await record();
    await write();
  } else {
    await write();
    await record();
  }
  return context.db.line.findFirstOrThrow({ where: { id: lineId }, include: LINE_INCLUDE });
}
