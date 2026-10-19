/** Consequences with a text in `assistant.approval.consequences.items` (ADR 0049). */
export const CONSEQUENCE_KEYS = [
  "priceKeptOnQuotes",
  "ticketsMove",
  "linesMove",
  "gridCellsCleared",
] as const;

export type ConsequenceKey = (typeof CONSEQUENCE_KEYS)[number];

/** The key when it has a text; an unknown key (a newer server) shows a generic line instead. */
export function consequenceKey({ key }: { key: string }): ConsequenceKey | null {
  return (CONSEQUENCE_KEYS as readonly string[]).includes(key) ? (key as ConsequenceKey) : null;
}
