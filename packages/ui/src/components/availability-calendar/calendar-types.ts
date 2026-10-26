/**
 * Who reads the calendar. Internal = venue staff (holds, states, buffers, staffing). External =
 * the customer (only what they bought, at the times they were sold).
 */
export type CalendarAudience = "internal" | "external";

/** ADR 0044: a hard hold blocks, a soft hold is prebooked and may overlap, none holds nothing. */
export type CalendarHold = "hard" | "soft" | "none";

/** One of the organization's own item states. Colors are data, passed as CSS colors. */
export type CalendarState = {
  name: string;
  color: string;
  /** Text on a solid fill of `color`. */
  ink: string;
  hold: CalendarHold;
};

export type CalendarPerson = {
  id: string;
  name: string;
  /** The organization's own position or role, e.g. "AV technician", "Waiter". */
  role: string;
  phone?: string;
  email?: string;
  /** The member profile photo; initials while there is none. */
  photoUrl?: string | null;
};

/**
 * Who to reach about a line, and why them (ADR 0034): the line's assignee, a responsibility's
 * holder ("Head of kitchen") or, when the line has none, the ticket's assignee.
 */
export type CalendarContact = {
  person: CalendarPerson;
  via: string;
  /** Set when the line has no contact of its own and shows the ticket's. */
  inherited?: boolean;
};

export type CalendarLine = {
  id: string;
  name: string;
  /** The organization's own item type name. */
  type: string;
  place: string | null;
  /** Local wall-clock times, "HH:mm", already in the venue's zone (ADR 0064). */
  start: string;
  end: string;
  /** Effective buffers (ADR 0059), 0 when none. Never shown externally. */
  setupMinutes: number;
  teardownMinutes: number;
  state: CalendarState;
  quantity: number;
  /** Set on the parts of a bundle; the bundle line frames them. */
  parentId?: string;
  /** Staff and equipment allocations: never on customer documents (ADR 0059). */
  internalOnly?: boolean;
  /** The one person to reach about this line; falls back to the ticket's contact. */
  contact?: CalendarContact;
  /** People allocated to work the line (ADR 0059): their time is taken. */
  staff?: readonly CalendarPerson[];
  /**
   * The ticket's guests attend this line: it is a place to find them. Staff and equipment lines
   * never are, and a bundle only frames its parts. Where lines overlap, the shortest one wins.
   */
  guests?: boolean;
  /** Notes for staff. Never shown to the customer. */
  notes?: string;
  /** Where "Open line" goes: the line on its ticket. Staff only. */
  href?: string;
};

export type CalendarTicket = {
  reference: string;
  customer: string;
  purpose: string;
  /** Plain date key "YYYY-MM-DD" (ADR 0064: never a column, only a code-level key). */
  date: string;
  headcount: number;
  /** The ticket's assignee: every line without its own contact falls back to this. */
  contact: CalendarContact;
  lines: readonly CalendarLine[];
};

/**
 * A row in the availability view: anything bookable. `group` is the organization's own type name
 * ("Spaces", "Staff", "Equipment"); code never names them.
 */
export type CalendarAsset = {
  id: string;
  name: string;
  group: string;
  /** One short fact that helps pick it, e.g. "40 seats". */
  detail?: string;
  /** Set when the asset is a person: the row shows their avatar. */
  person?: CalendarPerson;
};

/** A line placed on an asset, with the ticket and customer it belongs to (none for a block). */
export type AssetBooking = CalendarLine & {
  assetId: string;
  /** The line and ticket behind it, to load the ticket's other lines; none for a manual block. */
  lineId?: string;
  ticketId?: string;
  /** The day it is on, "YYYY-MM-DD" in the venue's zone (ADR 0064: a code-level key only). */
  date: string;
  ticket: string | null;
  customer: string | null;
  /** The ticket's guest count, when it has guests. */
  headcount?: number;
  /** The customer's own contact for the ticket: who to call on their side. */
  client?: ClientContact;
  /** What the booking is worth: its line total, excl. VAT. */
  value?: Money;
};

/** An amount in whole units of an ISO 4217 currency. */
export type Money = { amount: number; currency: string };

/** A person at the customer (B2B): a contact, never a guest. */
export type ClientContact = { name: string; phone?: string; email?: string };

/** A time window in minutes since midnight. */
export type CalendarWindow = { from: number; to: number };
