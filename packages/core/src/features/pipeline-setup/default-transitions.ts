import type { PipelineStateDraft } from "./schema";

export type StateTargetsInput = { states: readonly PipelineStateDraft[]; from: string };

/**
 * The default state transitions of the guided setup (ADR 0044): a state that is not released may
 * move to every later state and to every released state. A released state is final.
 */
export function defaultStateTargets({ states, from }: StateTargetsInput): string[] {
  const index = states.findIndex((state) => state.name === from);
  const source = states[index];
  if (!source || source.released) return [];
  return states
    .filter((state, at) => at !== index && (at > index || state.released === true))
    .map((state) => state.name);
}

export type CanMoveInput = StateTargetsInput & { to: string };

/** True when the default transitions allow a line to move from `from` to `to`. */
export const canMoveState = ({ states, from, to }: CanMoveInput) =>
  defaultStateTargets({ states, from }).includes(to);
