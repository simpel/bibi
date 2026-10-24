/**
 * One cell of a status grid template (ADR 0044) by name: entering `status` moves the lines of every
 * item type that has a state called `state`. Per status and type, the first matching cell wins;
 * a type without a matching state, and a status without a cell, keep the state. No domain
 * words in code: the names live in this data only.
 */
export type StatusGridTemplateCell = { status: string; state: string };

export type StatusGridTemplate = {
  key: string;
  name: string;
  cells: readonly StatusGridTemplateCell[];
};

export type CellsInInput = { statuses: readonly string[]; states: readonly string[] };

/** The cells of several statuses that all set the same states. */
export function cellsIn({ statuses, states }: CellsInInput): StatusGridTemplateCell[] {
  return statuses.flatMap((status) => states.map((state) => ({ status, state })));
}
