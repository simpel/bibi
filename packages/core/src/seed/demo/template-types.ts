/**
 * A line of a predefined order (ADR 0043) in the demo data: an item by name, an optional setup
 * by name, minutes from the order's start, a quantity (none: the order's headcount, ADR 0052)
 * and the choices it preselects, by option item name (ADR 0089).
 */
export type DemoTemplateLine = {
  item: string;
  setup?: string;
  name: string;
  offsetMinutes: number;
  durationMinutes: number;
  quantity?: number;
  options?: readonly string[];
};

/**
 * A predefined order (slice 5 of ADR 0025, `docs/demo-seed.md`): the order type and the status
 * orders start in by name, and its lines. Created before the orders that use it.
 */
export type DemoOrderTemplate = {
  name: string;
  type: string;
  status: string;
  /** The guest range the package is made for (ADR 0081). */
  minGuests?: number;
  maxGuests?: number;
  lines: readonly DemoTemplateLine[];
};
