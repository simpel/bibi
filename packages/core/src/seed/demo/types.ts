import type { PermissionSet } from "../../permissions/permission-set";
import type { RoleTemplateKey } from "../../templates/roles/role-templates";
import type { DemoBooking } from "./booking-types";
import type { DemoConfig } from "./config-types";
import type { DemoCustomer } from "./customer-types";

/** One demo staff member. `role` is `owner` or the name of a role defined for the org. */
export type DemoUser = { name: string; role: string };

/** Everything ADR 0025 seeds for one organization so far (`docs/demo-seed.md`). */
export type DemoOrg = {
  slug: string;
  name: string;
  /** Imported first; custom `roles` are created after it. */
  templates: readonly RoleTemplateKey[];
  roles: readonly { name: string; permissions: PermissionSet }[];
  users: readonly DemoUser[];
  config: DemoConfig;
  /** Slice 4: customers with their contact persons. */
  customers: readonly DemoCustomer[];
  /** Slice 5: bookings with their owners. */
  bookings: readonly DemoBooking[];
};
