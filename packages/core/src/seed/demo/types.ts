import type { PaymentRoute } from "../../features/payment-account/settings-schema";
import type { FixedRole } from "../../permissions/fixed-roles";
import type { PermissionOverride } from "../../permissions/overrides";
import type { OrderStatusTemplate } from "../../templates/order-statuses/order-status-template";
import type { DisplayFormats } from "../../time/display-formats";
import type { DemoConfig } from "./config-types";
import type { DemoCustomer } from "./customer-types";
import type { DemoDensity } from "./density-types";
import type { DemoOrder } from "./order-types";
import type { DemoTask } from "./task-types";
import type { DemoOrderTemplate } from "./template-types";

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

/** A run sheet definition (ADR 0092) by name: item types, counted lists and its responsibility. */
export type DemoRunSheetDefinition = {
  name: string;
  types: readonly string[];
  lists: readonly string[];
  responsibility: string;
};

/**
 * One cell of the status grid (ADR 0044) by name: entering `status` moves lines of item type
 * `type` to `state`. Cells that are not listed keep the state.
 */
export type DemoGridCell = { orderStatus: string; type: string; state: string };

/**
 * An organization's pipeline (ADR 0043, 0044): its statuses with flags and transitions (the shape of
 * a status template) and the grid cells by name. Item states come from the item types' templates.
 */
/**
 * The statuses and the grid; the only board is the default pipeline view, one phase per status
 * (ADR 0111).
 */
export type DemoPipeline = {
  statuses: OrderStatusTemplate;
  cells: readonly DemoGridCell[];
  /**
   * Statuses that only allow some moves (ADR 0076), by name; every other status lets an order
   * move to any status. The gates are the template's `gatesIn`, from any status.
   */
  restrictedMoves?: readonly { from: string; to: readonly string[] }[];
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

/** What every seeded organization has: the Better Auth rows and the profile's zone (ADR 0064). */
export type DemoOrgIdentity = {
  slug: string;
  name: string;
  /** The organization's IANA zone (ADR 0064): order-level times and the venue default. */
  timeZone: string;
  users: readonly DemoUser[];
};

/** Everything ADR 0025 seeds for one organization so far (`docs/demo-seed.md`). */
export type DemoOrg = DemoOrgIdentity & {
  config: DemoConfig;
  /** Slice 2: what each person answers for, with covered item types and default people. */
  responsibilities: readonly DemoResponsibility[];
  /** Slice 2: run sheet definitions, made before the orders so their commands generate versions. */
  runSheets: readonly DemoRunSheetDefinition[];
  /** Slice 4: customers with their contact persons. */
  customers: readonly DemoCustomer[];
  /** Slice 3: member profiles with their staff item links (ADR 0068); none when left out. */
  staff?: readonly DemoStaffLink[];
  /** Slice 5: the statuses and the status grid, set before the orders so their lines follow it. */
  pipeline: DemoPipeline;
  /** Slice 5: predefined orders (ADR 0043), created after the pipeline, before the orders. */
  templates: readonly DemoOrderTemplate[];
  /** Slice 5: orders with their assignee and followers, the generated ones (#488) last. */
  orders: readonly DemoOrder[];
  /** ADR 0117: tasks around customers, after the orders; some linked to them. None when left out. */
  tasks?: readonly DemoTask[];
  /** How the generated orders fill the calendar (#488), for the density check. */
  density?: DemoDensity;
  /** ADR 0077: the org number and revenue accounts per item type (by name). */
  finance?: DemoFinance;
  /** ADR 0090: the deposit rule and invoice provider; none for an organization without one. */
  paymentSettings?: DemoPaymentSettings;
  /** ADR 0100: connected before the orders' money is seeded; Stripe is connected for any money. */
  providers?: readonly DemoProvider[];
  /** ADR 0094: members who have read their oldest notifications; the rest stay unread. */
  notificationReads?: readonly DemoNotificationReads[];
};

/** ADR 0094: `user` has read their `read` oldest notifications (`notification.markRead`). */
export type DemoNotificationReads = { user: string; read: number };

/** ADR 0090: the deposit rule and the invoice provider (`PaymentSettings`); none when left out. */
export type DemoPaymentSettings = {
  depositPercent?: number;
  depositMinimumMinor?: number;
  /** ADR 0100: which provider takes each method; saved last, with the rule. */
  routes: readonly PaymentRoute[];
};

/** The providers a demo organization connects besides Stripe (memory fakes, ADR 0100). */
export type DemoProvider = "SWISH" | "FORTNOX" | "VISMA";

export type DemoFinance = {
  orgNumber: string;
  revenueAccounts: readonly { type: string; account: string }[];
};
