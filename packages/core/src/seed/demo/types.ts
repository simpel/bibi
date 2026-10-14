import type { PermissionSet } from "../../permissions/permission-set";
import type { RoleTemplateKey } from "../../templates/roles/role-templates";

/** One demo staff member. `role` is `owner` or the name of a role defined for the org. */
export type DemoUser = { name: string; role: string };

/** Everything slice 1 of ADR 0019 seeds for one organization (`docs/demo-seed.md`). */
export type DemoOrg = {
  slug: string;
  name: string;
  /** Imported first; custom `roles` are created after it. */
  templates: readonly RoleTemplateKey[];
  roles: readonly { name: string; permissions: PermissionSet }[];
  users: readonly DemoUser[];
};
