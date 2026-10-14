import type { OrgRole } from "../permissions";

/** Authenticated caller after credential checks, before the execute context is built. */
export type Principal = {
  userId: string;
  organizationId: string;
  /** Effective roles in `organizationId` (membership, capped by key permissions for API keys). */
  roles: OrgRole[];
  /** Whether `x-okazi-actor: ai` may be honoured (first-party web client tokens only). */
  aiAllowed: boolean;
};
