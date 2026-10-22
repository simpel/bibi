import type { OperationContext } from "../../operations/types";
import { loadOrganizationProfile, ORGANIZATION_PROFILE_SELECT } from "./load-organization-profile";
import type { OrganizationProfileDto, OrganizationProfileUpdateInput, SetupStatus } from "./schema";

export type SaveOrganizationProfileInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "recordChange">;
  data: OrganizationProfileUpdateInput & { setupStatus?: SetupStatus };
};

/**
 * Creates or changes the organization's one profile row and records the audit change. Fields
 * left out keep their value; a new row starts `PENDING` unless `setupStatus` says otherwise.
 */
export async function saveOrganizationProfile({
  context,
  data,
}: SaveOrganizationProfileInput): Promise<OrganizationProfileDto> {
  const before = await loadOrganizationProfile({ context });
  const after = await context.db.organizationProfile.upsert({
    where: { organizationId: context.organizationId },
    create: { ...data, organizationId: context.organizationId },
    update: data,
    select: ORGANIZATION_PROFILE_SELECT,
  });
  context.recordChange({ entityId: after.id, before: before ?? undefined, after });
  return after;
}
