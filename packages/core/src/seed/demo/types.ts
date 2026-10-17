import type { FixedRole } from "../../permissions/fixed-roles";
import type { DemoBooking } from "./booking-types";
import type { DemoConfig } from "./config-types";
import type { DemoCustomer } from "./customer-types";

/** One demo staff member with their fixed access role (ADR 0034). */
export type DemoUser = { name: string; role: FixedRole };

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

/** Everything ADR 0025 seeds for one organization so far (`docs/demo-seed.md`). */
export type DemoOrg = {
  slug: string;
  name: string;
  users: readonly DemoUser[];
  config: DemoConfig;
  /** Slice 2: what each person answers for, with covered item types and default people. */
  responsibilities: readonly DemoResponsibility[];
  /** Slice 4: customers with their contact persons. */
  customers: readonly DemoCustomer[];
  /** Slice 5: bookings with their assignee and followers. */
  bookings: readonly DemoBooking[];
};
