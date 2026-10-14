import type { PermissionSet } from "@okazi/core";

/** Authenticated caller after credential checks, before the execute context is built. */
export type Principal = {
  userId: string;
  organizationId: string;
  /** Role names in `organizationId`; `null` when the user is not a member. */
  roles: string[] | null;
  /** Effective permissions (membership, intersected with the key's for API keys). */
  permissions: PermissionSet;
  /** Whether `x-okazi-actor: ai` may be honoured (first-party web client tokens only). */
  aiAllowed: boolean;
};
