import type { PermissionSet } from "@bibi/core";

/** Authenticated caller after credential checks, before the execute context is built. */
export type Principal = {
  /** The signed-in user; `null` for an API key, which belongs to the organization (ADR 0050). */
  userId: string | null;
  /** Set for API key requests: the key is the actor. */
  apiKeyId?: string;
  organizationId: string;
  /** Preset names in `organizationId`; `null` when the user is not a member. */
  roles: string[] | null;
  /** Effective permissions: preset plus overrides (ADR 0050). */
  permissions: PermissionSet;
  /** Whether `x-bibi-actor: ai` may be honoured (first-party web client tokens only). */
  aiAllowed: boolean;
};
