import { provisionOrganization } from "@bibi/core";
import type { Db } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { APIError } from "better-auth/api";
import { creationTimeZone } from "../organization/creation-time-zone";

export type ProvisionHookInput = { organization: { id: string; metadata?: unknown } };

/**
 * `afterCreateOrganization`: gives the new organization its defaults (its profile with the chosen
 * time zone, ADR 0064, and a minimal set of ticket phases, ADR 0043) through core as SYSTEM, then
 * clears the `metadata` that carried the zone in. Core logs the operation; a failure is surfaced to
 * the creator instead of leaving an organization that cannot take tickets unnoticed.
 */
export function provisionOrganizationHook({ db }: { db: Db }) {
  return async ({ organization }: ProvisionHookInput): Promise<void> => {
    const timeZone = creationTimeZone({ metadata: organization.metadata });
    const result = await provisionOrganization({ organizationId: organization.id, timeZone });
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
