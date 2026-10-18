/**
 * One cell of a phase grid template (ADR 0044) by name: entering `phase` moves the lines of every
 * item type that has a state called `state`. Per phase and type, the first matching cell wins;
 * a type without a matching state, and a phase without a cell, keep the state. No domain
 * words in code: the names live in this data only.
 */
export type PhaseGridTemplateCell = { phase: string; state: string };

export type PhaseGridTemplate = {
  key: string;
  name: string;
  cells: readonly PhaseGridTemplateCell[];
};

export type CellsInInput = { phases: readonly string[]; states: readonly string[] };

/** The cells of several phases that all set the same states. */
export function cellsIn({ phases, states }: CellsInInput): PhaseGridTemplateCell[] {
  return phases.flatMap((phase) => states.map((state) => ({ phase, state })));
}
