import type { FixedRole } from "../../permissions/fixed-roles";
import type { PermissionOverride } from "../../permissions/overrides";
import type { TicketPhaseTemplate } from "../../templates/ticket-phases/ticket-phase-template";
import type { DemoConfig } from "./config-types";
import type { DemoCustomer } from "./customer-types";
import type { DemoTicketTemplate } from "./template-types";
import type { DemoTicket } from "./ticket-types";

/** One demo staff member with their preset and optional overrides (ADR 0034, 0050). */
export type DemoUser = { name: string; role: FixedRole; overrides?: readonly PermissionOverride[] };

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
 * One cell of the phase grid (ADR 0044) by name: entering `phase` moves lines of item type
 * `type` to `state`. Cells that are not listed keep the state.
 */
export type DemoGridCell = { phase: string; type: string; state: string };

/**
 * An organization's pipeline (ADR 0043, 0044): its phases with flags and transitions (the shape of
 * a phase template) and the grid cells by name. Item states come from the item types' templates.
 */
export type DemoPipeline = { phases: TicketPhaseTemplate; cells: readonly DemoGridCell[] };

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
  /** Slice 5: the phases and the phase grid, set before the tickets so their lines follow it. */
  pipeline: DemoPipeline;
  /** Slice 5: predefined tickets (ADR 0043), created after the pipeline, before the tickets. */
  templates: readonly DemoTicketTemplate[];
  /** Slice 5: tickets with their assignee and followers. */
  tickets: readonly DemoTicket[];
};
