import { provisionOrganization } from "@bibi/core";
import type { Db } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { APIError } from "better-auth/api";
import { creationTimeZone } from "../organization/creation-time-zone";

export type ProvisionHookInput = {
  organization: { id: string; metadata?: unknown };
  user: { id: string; email: string; emailVerified: boolean };
};

/**
 * `afterCreateOrganization`: gives the new organization its defaults (its profile with the chosen
 * time zone, ADR 0064, domain join with the creator's domain, ADR 0078, and a minimal set of ticket statuses, ADR 0043) through core as SYSTEM, then
 * clears the `metadata` that carried the zone in. Core logs the operation; a failure is surfaced to
 * the creator instead of leaving an organization that cannot take tickets unnoticed.
 */
export function provisionOrganizationHook({ db }: { db: Db }) {
  return async ({ organization, user }: ProvisionHookInput): Promise<void> => {
    const timeZone = creationTimeZone({ metadata: organization.metadata });
    const creator = { userId: user.id, email: user.email, emailVerified: user.emailVerified };
    const organizationId = organization.id;
    const result = await provisionOrganization({ organizationId, timeZone, creator });
    if (!result.ok) {
      throw new APIError("INTERNAL_SERVER_ERROR", {
        message: `Organization defaults could not be created: ${result.error.message}`,
      });
    }
    // The organization works without this; a failed clear is logged, never the creator's error.
    await db.organization
      .update({ where: { id: organization.id }, data: { metadata: null } })
      .catch((error: unknown) =>
        getLogger().warn({ event: "auth.organizationMetadataNotCleared", err: error }),
      );
  };
}
