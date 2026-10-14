import type { PermissionSet } from "../../permissions/permission-set";

/** A named set of roles an organization can import and then edit (ADR 0014, 0015). */
export type RoleTemplate = {
  key: string;
  /** Display name of the template, e.g. "Konferensgård". */
  name: string;
  roles: readonly { name: string; permissions: PermissionSet }[];
};
