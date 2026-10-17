import type { FixedRole } from "../../permissions/fixed-roles";
import type { DemoBooking } from "./booking-types";
import type { DemoConfig } from "./config-types";
import type { DemoCustomer } from "./customer-types";

/** One demo staff member with their fixed access role (ADR 0034). */
export type DemoUser = { name: string; role: FixedRole };

/** Everything ADR 0025 seeds for one organization so far (`docs/demo-seed.md`). */
export type DemoOrg = {
  slug: string;
  name: string;
  users: readonly DemoUser[];
  config: DemoConfig;
  /** Slice 4: customers with their contact persons. */
  customers: readonly DemoCustomer[];
  /** Slice 5: bookings with their owners. */
  bookings: readonly DemoBooking[];
};
