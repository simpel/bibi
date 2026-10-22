import {
  getOrganizationProfile,
  type OrganizationProfileDto,
  OrganizationProfileSchema,
  setOrganizationSetupStatus,
  updateOrganizationProfile,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const OrganizationProfileRef = objectFromSchema<OrganizationProfileDto>({
  name: "OrganizationProfile",
  schema: OrganizationProfileSchema,
  description: "The organization's first setup status, legal and contact details (ADR 0061).",
});

fieldFromOperation({
  operation: getOrganizationProfile,
  type: OrganizationProfileRef,
  name: "organizationProfile",
});
mutationFromOperation({ operation: updateOrganizationProfile, type: OrganizationProfileRef });
mutationFromOperation({ operation: setOrganizationSetupStatus, type: OrganizationProfileRef });
