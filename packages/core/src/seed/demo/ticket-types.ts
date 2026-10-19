import type { DemoFieldValues } from "./config-types";

/**
 * A demo ticket (slice 5 of ADR 0025, `docs/demo-seed.md`). `ref` is the row in the spec (L1,
 * V3, …); `day` is the offset from the day of the run and `from`/`to` local times (HH:MM,
 * Europe/Stockholm) of the desired period on that day. Customer, type, phase and people are
 * referred to by name.
 */
export type DemoTicket = {
  ref: string;
  customer: string;
  type: string;
  day: number;
  from: string;
  to: string;
  headcount: number;
  /**
   * A predefined ticket (`templates.ts`) the ticket is created from with `ticket.createFromTemplate`
   * (ADR 0043): its lines and start phase come from it, so `phase` must be the template's phase
   * and `to` the end of its last line.
   */
  template?: string;
  /** The phase the ticket is moved to after it is created (ADR 0043); default: the entry phase. */
  phase?: string;
  /**
   * The item (by name) the ticket's quote charges, for a `phase` that a quote event enters: the
   * ticket gets an untimed line of it (unless a line has it), then a quote of its priced lines
   * that is sent, and for the accepted event accepted (ADR 0043, 0052).
   */
  quote?: string;
  /**
   * Money (ADR 0057): a SENT deposit request, and a SUCCEEDED card payment of `paidKr` against
   * the accepted quote (the ticket's `phase` must accept it).
   */
  money?: { deposit?: { description: string; amountKr: number }; paidKr?: number };
  /** A line (by name) whose quantity changes after the quote, so it differs from it (ADR 0052). */
  changeAfterQuote?: { line: string; quantity: number };
  /** The reason of that move, for phases that require one. */
  reason?: string;
  /** The main assignee (ADR 0034), by user name. */
  assignee?: string;
  /** Members who follow the ticket, by user name. */
  followers?: readonly string[];
  fields?: DemoFieldValues;
  /** `holdsUntil` (ADR 0044) as an offset in days from the day of the run, at the end of that day. */
  holdsUntilDay?: number;
  /** The ticket's lines, on the ticket's day. */
  lines?: readonly DemoLine[];
  /**
   * A phase move `checkDemoGrid` makes after seeding (ADR 0044): `blocked` moves must be refused
   * and change nothing; the others must move the lines as the grid says, skipping overrides.
   */
  checkMove?: { to: string; blocked: boolean };
};

/**
 * A line (ADR 0044): an item by name, what it is for and local times on the ticket's day; no
 * times = an untimed line, e.g. a fee (ADR 0052). `state` overrides the line's state by name
 * (`line.changeState`) right after it is created. `quantity` and `unitPriceKr` are the line's own
 * values; left out, the line counts the ticket's headcount and inherits the price.
 */
export type DemoLine = {
  item: string;
  name: string;
  from?: string;
  to?: string;
  state?: string;
  quantity?: number;
  unitPriceKr?: number;
};
