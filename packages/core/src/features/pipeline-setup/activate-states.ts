import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { createEntityType, updateEntityType } from "../entity-type/write-operations";
import { archiveItemState } from "../item-state/archive-operation";
import { loadStatesOfType } from "../item-state/load-item-state";
import { reorderItemStates, setItemStateTransitions } from "../item-state/order-operations";
import { createItemState, updateItemState } from "../item-state/write-operations";
import { defaultStateTargets } from "./default-transitions";
import type { PipelineStateDraft, PipelineTypeDraft } from "./schema";

/** An item type as set up: its id and its states' ids by name. */
export type SetUpType = { entityTypeId: string; stateIds: Map<string, string> };

type TypeInput = { context: OperationContext; draft: PipelineTypeDraft };

const flagsOf = ({ state }: { state: PipelineStateDraft }) => ({
  color: state.color,
  initial: state.initial ?? false,
  hold: state.hold ?? "NONE",
  inSheets: state.inSheets ?? false,
  released: state.released ?? false,
  expires: state.expires ?? false,
});

/** The draft's type: the existing one, or a new item type (with its default state). */
async function ensureType({ context, draft }: TypeInput): Promise<Result<string>> {
  if (draft.entityTypeId) return ok({ value: draft.entityTypeId });
  const input = { base: "ITEM" as const, name: draft.name, behaviours: draft.behaviours ?? [] };
  const created = await runNested({ operation: createEntityType, input, context });
  return created.ok ? ok({ value: created.value.id }) : created;
}

type StatesInput = TypeInput & { entityTypeId: string };

/**
 * Creates or updates (by name) every state of the draft, the initial one first so it takes the
 * flag before the others lose it, then archives the type's other states: their lines move to the
 * initial state.
 */
async function upsertStates({ context, draft, entityTypeId }: StatesInput) {
  const existing = await loadStatesOfType({ context, entityTypeId });
  const ordered = [...draft.states].sort((a, b) => Number(b.initial ?? 0) - Number(a.initial ?? 0));
  const stateIds = new Map<string, string>();
  for (const state of ordered) {
    const found = existing.find((row) => row.name === state.name);
    const saved = found
      ? await runNested({
          operation: updateItemState,
          input: { id: found.id, ...flagsOf({ state }) },
          context,
        })
      : await runNested({
          operation: createItemState,
          input: { entityTypeId, name: state.name, ...flagsOf({ state }) },
          context,
        });
    if (!saved.ok) return saved;
    stateIds.set(state.name, saved.value.id);
  }
  const targetStateId = stateIds.get(ordered[0]?.name ?? "");
  for (const row of existing.filter((candidate) => !stateIds.has(candidate.name))) {
    const input = { id: row.id, ...(targetStateId ? { targetStateId } : {}) };
    const archived = await runNested({ operation: archiveItemState, input, context });
    if (!archived.ok) return archived;
  }
  return ok({ value: stateIds });
}

type FinishInput = StatesInput & { stateIds: Map<string, string> };

/** The draft's order, the default transitions and the expiry state. */
async function finishStates({ context, draft, entityTypeId, stateIds }: FinishInput) {
  const idOf = ({ name }: { name: string }) => stateIds.get(name) ?? "";
  const ids = draft.states.map((state) => idOf({ name: state.name }));
  const reordered = await runNested({
    operation: reorderItemStates,
    input: { entityTypeId, ids },
    context,
  });
  if (!reordered.ok) return reordered;
  for (const state of draft.states) {
    const targets = defaultStateTargets({ states: draft.states, from: state.name });
    const input = {
      id: idOf({ name: state.name }),
      toStateIds: targets.map((name) => idOf({ name })),
    };
    const set = await runNested({ operation: setItemStateTransitions, input, context });
    if (!set.ok) return set;
  }
  const expiryStateId = draft.expiryState ? idOf({ name: draft.expiryState }) : null;
  const input = { id: entityTypeId, expiryStateId };
  const updated = await runNested({ operation: updateEntityType, input, context });
  return updated.ok ? ok({ value: true }) : updated;
}

/** Sets up one draft item type with its states through the normal operations. */
export async function activateType({ context, draft }: TypeInput): Promise<Result<SetUpType>> {
  const type = await ensureType({ context, draft });
  if (!type.ok) return type;
  const entityTypeId = type.value;
  const states = await upsertStates({ context, draft, entityTypeId });
  if (!states.ok) return states;
  const stateIds = states.value;
  const finished = await finishStates({ context, draft, entityTypeId, stateIds });
  return finished.ok ? ok({ value: { entityTypeId, stateIds } }) : finished;
}
