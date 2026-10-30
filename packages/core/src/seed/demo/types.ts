import type { FixedRole } from "../../permissions/fixed-roles";
import type { PermissionOverride } from "../../permissions/overrides";
import type { TicketStatusTemplate } from "../../templates/ticket-statuses/ticket-status-template";
import type { DisplayFormats } from "../../time/display-formats";
import type { DemoConfig } from "./config-types";
import type { DemoCustomer } from "./customer-types";
import type { DemoDensity } from "./density-types";
import type { DemoTicketTemplate } from "./template-types";
import type { DemoTicket } from "./ticket-types";

/** One demo staff member with their preset and optional overrides (ADR 0034, 0050). */
export type DemoUser = {
  name: string;
  role: FixedRole;
  overrides?: readonly PermissionOverride[];
  /** The user's own date and clock formats (ADR 0046); omitted = the defaults. */
  displayFormats?: Partial<DisplayFormats>;
};

/**
 * A responsibility (ADR 0034): the item types it covers by name, and the default assignee and
 * followers by user name (every one of them is one of the organization's users).
 */
export type DemoResponsibility = {
  name: string;
  types: readonly string[];
  assignee: string;
  followers?: readonly string[];
};

/**
 * One cell of the status grid (ADR 0044) by name: entering `status` moves lines of item type
 * `type` to `state`. Cells that are not listed keep the state.
 */
export type DemoGridCell = { ticketStatus: string; type: string; state: string };

/**
 * An organization's pipeline (ADR 0043, 0044): its statuses with flags and transitions (the shape of
 * a status template) and the grid cells by name. Item states come from the item types' templates.
 */
/** A phase (column) of a demo board: a name and the statuses it shows, by status name. */
export type DemoBoardPhase = { name: string; statuses: readonly string[] };

/** An extra board (ADR 0067): its phases left to right; statuses in no phase are off the board. */
export type DemoBoard = { name: string; phases: readonly DemoBoardPhase[] };

/**
 * The statuses, the grid and the boards beyond the default "Pipeline" board that
 * `ticketStatus.create` keeps (one phase per status).
 */
export type DemoPipeline = {
  statuses: TicketStatusTemplate;
  cells: readonly DemoGridCell[];
  boards?: readonly DemoBoard[];
};

/**
 * A member's profile (ADR 0068) by name: the schedule kind (default PATTERN) and the staff items
 * linked to them, by item name.
 */
export type DemoStaffLink = {
  member: string;
  scheduleKind?: "PATTERN" | "SHIFTS" | "CASUAL";
  items: readonly string[];
};

/** Everything ADR 0025 seeds for one organization so far (`docs/demo-seed.md`). */
export type DemoOrg = {
  slug: string;
  name: string;
  /** The organization's IANA zone (ADR 0064): ticket-level times and the venue default. */
  timeZone: string;
  users: readonly DemoUser[];
  config: DemoConfig;
  /** Slice 2: what each person answers for, with covered item types and default people. */
  responsibilities: readonly DemoResponsibility[];
  /** Slice 4: customers with their contact persons. */
  customers: readonly DemoCustomer[];
  /** Slice 3: member profiles with their staff item links (ADR 0068); none when left out. */
  staff?: readonly DemoStaffLink[];
  /** Slice 5: the statuses and the status grid, set before the tickets so their lines follow it. */
  pipeline: DemoPipeline;
  /** Slice 5: predefined tickets (ADR 0043), created after the pipeline, before the tickets. */
  templates: readonly DemoTicketTemplate[];
  /** Slice 5: tickets with their assignee and followers, the generated ones (#488) last. */
  tickets: readonly DemoTicket[];
  /** How the generated tickets fill the calendar (#488), for the density check. */
  density?: DemoDensity;
};
