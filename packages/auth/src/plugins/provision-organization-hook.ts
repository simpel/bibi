import { provisionOrganization } from "@okazi/core";
import { APIError } from "better-auth/api";

export type ProvisionHookInput = { organization: { id: string } };

/**
 * `afterCreateOrganization`: gives the new organization its defaults (one booking status per
 * phase, ADR 0022) through core as SYSTEM. Core logs the operation; a failure is surfaced to
 * the creator instead of leaving an organization that cannot take bookings unnoticed.
 */
export async function provisionOrganizationHook({ organization }: ProvisionHookInput) {
  const result = await provisionOrganization({ organizationId: organization.id });
  if (!result.ok) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: `Organization defaults could not be created: ${result.error.message}`,
    });
  }
}
