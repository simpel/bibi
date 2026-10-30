/** The slice of a ticket status the default transitions need. */
export type TransitionStatus = {
  id: string;
  closes: boolean;
  transitionsTo: readonly string[];
};

export type NewStatusTransitionsInput = {
  /** The status just created. */
  created: TransitionStatus;
  /** Every active status, the new one included. */
  statuses: readonly TransitionStatus[];
  /** Status ids in board order (phase by phase); the new status's place decides "after it". */
  boardOrder: readonly string[];
};

export type TransitionUpdate = { id: string; toStatusIds: string[] };

/**
 * Default transitions for a status made in customize mode, so tickets can move into it right
 * away: every open status may move to it, and it may move to every status after it on the board
 * and to every closing status. A closing status gets no way out (ADR 0043). Edit them later in
 * the transitions dialog.
 */
export function newStatusTransitions({
  created,
  statuses,
  boardOrder,
}: NewStatusTransitionsInput): TransitionUpdate[] {
  const into = statuses
    .filter((s) => s.id !== created.id && !s.closes && !s.transitionsTo.includes(created.id))
    .map((s) => ({ id: s.id, toStatusIds: [...s.transitionsTo, created.id] }));
  if (created.closes) return into;
  const at = boardOrder.indexOf(created.id);
  const after = at < 0 ? [] : boardOrder.slice(at + 1);
  const closing = statuses.filter((s) => s.closes).map((s) => s.id);
  const known = new Set(statuses.map((s) => s.id));
  const out = [...new Set([...after, ...closing])].filter(
    (id) => id !== created.id && known.has(id),
  );
  return [...into, { id: created.id, toStatusIds: out }];
}
