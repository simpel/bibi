import type { DemoFieldValues } from "./config-types";
import type { DemoProvider } from "./types";

/**
 * An explicit choice on an order's responsibility (ADR 0055): the only thing stored besides the
 * defaults. `assignee` answers for the responsibility instead of its default assignee; `unfollow`
 * leaves its default followers. Both by user name.
 */
export type DemoChoice = { responsibility: string; assignee?: string; unfollow?: string };

/**
 * A demo order (slice 5 of ADR 0025, `docs/demo-seed.md`). `ref` is the row in the spec (L1,
 * V3, …); `day` is the offset from the day of the run and `from`/`to` local times (HH:MM, the
 * organization's zone; lines in the venue's) of the desired period on that day. Customer, type, status and people are
 * referred to by name.
 */
export type DemoOrder = {
  ref: string;
  customer: string;
  type: string;
  day: number;
  from: string;
  to: string;
  headcount: number;
  /**
   * A predefined order (`templates.ts`) the order is created from with `order.createFromTemplate`
   * (ADR 0043): its lines and start status come from it, so `status` must be the template's status
   * and `to` the end of its last line.
   */
  template?: string;
  /** The status the order is moved to after it is created (ADR 0043); default: the entry status. */
  status?: string;
  /**
   * ADR 0079: the order gets its quote (see `quote`), accepted, and is then moved on to
   * `status`, a status without a quote event: Completed for a won order, or Final count locked.
   */
  won?: true;
  /**
   * The item (by name) the order's quote charges, for a `status` that a quote event enters: the
   * order gets an untimed line of it (unless a line has it), then a quote of its priced lines
   * that is sent, and for the accepted event accepted (ADR 0043, 0052).
   */
  quote?: string;
  /**
   * Money (ADR 0057): a SENT deposit request, and a SUCCEEDED card payment of `paidKr` against
   * the accepted quote (the order's `status` must accept it).
   */
  money?: {
    deposit?: { description: string; amountKr: number };
    paidKr?: number;
    /** ADR 0100: a Swish payment of this many kr against the accepted quote (Swish signal). */
    swishKr?: number;
    /** ADR 0100: money recorded by staff against the accepted quote (`payment.recordManual`). */
    manual?: { kr: number; note: string };
    /** ADR 0077: an invoice of the priced lines, sent; paid in full or due `dueDay` (offset). */
    invoice?: DemoInvoice;
  };
  /** Estimated values in kr excl. VAT, in order: the first estimate, then re-estimates (ADR 0074). */
  estimatesKr?: readonly number[];
  /** A line (by name) whose quantity changes after the quote, so it differs from it (ADR 0052). */
  changeAfterQuote?: { line: string; quantity: number };
  /** The reason of that move, for statuses that require one. */
  reason?: string;
  /** The main assignee (ADR 0034), by user name. */
  assignee?: string;
  /** Booking-level notes (ADR 0081). The contact is the customer's first contact. */
  note?: string;
  /** Members who follow the order, by user name. */
  followers?: readonly string[];
  /** Explicit choices that differ from the responsibilities' defaults (ADR 0055). */
  choices?: readonly DemoChoice[];
  fields?: DemoFieldValues;
  /** The order's title; left out: its `Purpose` field (else its type) and customer. */
  title?: string;
  /** `holdsUntil` (ADR 0044) as an offset in days from the day of the run, at the end of that day. */
  holdsUntilDay?: number;
  /** The order's lines, on the order's day. */
  lines?: readonly DemoLine[];
  /** Bundles expanded onto the order as a bundle line with part lines (ADR 0059). */
  bundles?: readonly DemoBundleLine[];
  /** Lines (by name) grouped as alternatives the customer picks one of (ADR 0052). */
  alternatives?: readonly DemoAlternative[];
  /**
   * A status move `checkDemoGrid` makes after seeding (ADR 0044): `blocked` moves must be refused
   * and change nothing; the others must move the lines as the grid says, skipping overrides.
   */
  checkMove?: { to: string; blocked: boolean };
};

/**
 * A demo invoice (ADR 0077). Day offsets are from the day of the run; each step runs at its own
 * day through the context clock (`OperationContext.now`), so the history has real dates. Left
 * out, `sentDay` and `paidDay` are the day of the run. `refund` is a partial refund of the paid
 * invoice, applied through Stripe's refunded signal.
 */
export type DemoInvoice = {
  paid: boolean;
  dueDay: number;
  sentDay?: number;
  paidDay?: number;
  refund?: { kr: number; day: number };
  /**
   * ADR 0100: raised in this ledger provider (the INVOICE route is set to it first). Its payments
   * are what the provider reports (`invoice.sync`), never a card payment.
   */
  provider?: Exclude<DemoProvider, "SWISH">;
  /** A credit note of this many kr on the open invoice (`invoice.credit`). */
  credit?: { kr: number; reason: string };
};

/**
 * A line (ADR 0044): an item by name, what it is for and local times on the order's day; no
 * times = an untimed line, e.g. a fee (ADR 0052). `state` overrides the line's state by name
 * (`line.changeState`) right after it is created. `quantity` and `unitPriceKr` are the line's own
 * values; left out, the line counts the order's headcount and inherits the price.
 */
/**
 * A customisation option chosen on a line (ADR 0059), by item name; `quantity` in a split group
 * (ADR 0082). `unitPriceKr` is the option line's own price, set after the choice (`line.update`).
 */
export type DemoLineOption = { name: string; quantity?: number; unitPriceKr?: number };

/** An add-on under a line (ADR 0088): item by name, own times, quantity and price if given. */
export type DemoAddOn = {
  item: string;
  name: string;
  from?: string;
  to?: string;
  quantity?: number;
  unitPriceKr?: number;
};

export type DemoLine = {
  item: string;
  name: string;
  /** The line's chosen options (`line.chooseOptions`, ADR 0059, 0082), every group's. */
  options?: readonly DemoLineOption[];
  /** Add-ons under the line (ADR 0088), made after its options. */
  addOns?: readonly DemoAddOn[];
  from?: string;
  to?: string;
  state?: string;
  quantity?: number;
  unitPriceKr?: number;
  /** Overrides of the item's setup and teardown minutes (ADR 0059). */
  setupMinutes?: number;
  teardownMinutes?: number;
};

/**
 * An alternative group (ADR 0052): its name and its options as line names. `chosen` is the option
 * the customer picks when the order's quote is accepted (`quote.accept` with `chosenLineIds`);
 * without it the group stays open and every option keeps its soft hold.
 */
export type DemoAlternative = { name: string; lines: readonly string[]; chosen?: string };

/**
 * A bundle (ADR 0059) by item name, expanded with `line.expandBundle` at local times on the
 * order's day: a bundle line that carries the price and one part line per part.
 */
export type DemoBundleLine = { item: string; from: string; to: string };
