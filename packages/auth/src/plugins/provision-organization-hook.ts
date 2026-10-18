import { provisionOrganization } from "@okazi/core";
import { APIError } from "better-auth/api";

export type ProvisionHookInput = { organization: { id: string } };

/**
 * `afterCreateOrganization`: gives the new organization its defaults (a minimal set of
 * ticket phases, ADR 0043) through core as SYSTEM. Core logs the operation; a failure is surfaced to
 * the creator instead of leaving an organization that cannot take tickets unnoticed.
 */
export async function provisionOrganizationHook({ organization }: ProvisionHookInput) {
  const result = await provisionOrganization({ organizationId: organization.id });
  if (!result.ok) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: `Organization defaults could not be created: ${result.error.message}`,
    });
  }
}
