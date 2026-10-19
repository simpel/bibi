/**
 * A line of a predefined ticket (ADR 0043) in the demo data: an item by name, an optional setup
 * by name, minutes from the ticket's start, and a quantity (none: the ticket's headcount, ADR 0052).
 */
export type DemoTemplateLine = {
  item: string;
  setup?: string;
  name: string;
  offsetMinutes: number;
  durationMinutes: number;
  quantity?: number;
};

/**
 * A predefined ticket (slice 5 of ADR 0025, `docs/demo-seed.md`): the ticket type and the phase
 * tickets start in by name, and its lines. Created before the tickets that use it.
 */
export type DemoTicketTemplate = {
  name: string;
  type: string;
  phase: string;
  lines: readonly DemoTemplateLine[];
};
