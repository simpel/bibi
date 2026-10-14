import type { PermissionSet } from "../../permissions/permission-set";

/** A named set of roles an organization can import and then edit (ADR 0020, 0021). */
export type RoleTemplate = {
  key: string;
  /** Display name of the template, e.g. "Conference venue". */
  name: string;
  roles: readonly { name: string; permissions: PermissionSet }[];
};
