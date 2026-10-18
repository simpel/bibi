/**
 * Ratchet for `isolation-coverage.test.ts`. Operations listed here have no cross-organization
 * isolation step yet. The list may only shrink: cover an operation in `isolation-<area>.test.ts`
 * and delete its line. A new operation never goes here.
 */
export const ISOLATION_GAPS: string[] = [
  // Series operations exist on main only; the ticket-model branch removes them, delete this line then.
  "bookingSeries.updateOccurrences",
];
