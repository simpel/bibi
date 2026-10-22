import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { EMPTY_ORGANIZATION_PROFILE, loadOrganizationProfile } from "./load-organization-profile";
import { saveOrganizationProfile } from "./save-organization-profile";
import {
  OrganizationProfileGetInputSchema,
  OrganizationProfileSchema,
  OrganizationProfileSetSetupStatusInputSchema,
  OrganizationProfileUpdateInputSchema,
} from "./schema";

export const getOrganizationProfile = defineOperation({
  name: "organizationProfile.get",
  kind: "query",
  description:
    "Read the organization's profile: first setup status (PENDING, COMPLETED, SKIPPED), legal " +
    "name, org number, address, website and contact details. Defaults when never saved.",
  input: OrganizationProfileGetInputSchema,
  output: OrganizationProfileSchema,
  permission: "configuration:read",
  handler: async ({ context }) => {
    const row = await loadOrganizationProfile({ context });
    return ok({ value: row ?? EMPTY_ORGANIZATION_PROFILE });
  },
});

export const updateOrganizationProfile = defineOperation({
  name: "organizationProfile.update",
  kind: "command",
  description:
    "Change the organization's legal name, org number, address, country (ISO-2), website or " +
    "contact email and phone. Omitted fields keep their value; null clears one.",
  input: OrganizationProfileUpdateInputSchema,
  output: OrganizationProfileSchema,
  permission: "configuration:write",
  handler: async ({ input, context }) =>
    ok({ value: await saveOrganizationProfile({ context, data: input }) }),
});

export const setOrganizationSetupStatus = defineOperation({
  name: "organizationProfile.setSetupStatus",
  kind: "command",
  description:
    "Set where the organization is in its first setup: PENDING (start or restart it), " +
    "COMPLETED or SKIPPED.",
  input: OrganizationProfileSetSetupStatusInputSchema,
  output: OrganizationProfileSchema,
  permission: "pipeline:write",
  handler: async ({ input, context }) =>
    ok({ value: await saveOrganizationProfile({ context, data: input }) }),
});

/** The organization's own facts and first setup status (ADR 0061). */
export const organizationProfileOperations = [
  getOrganizationProfile,
  updateOrganizationProfile,
  setOrganizationSetupStatus,
];
