import type { OperationContext } from "../../operations/types";
import { FALLBACK_TIME_ZONE } from "../../time/time-zone";
import { DEFAULT_ARCHIVE_RETENTION_DAYS } from "./retention";
import type { OrganizationProfileDto } from "./schema";

export const ORGANIZATION_PROFILE_SELECT = {
  id: true,
  setupStatus: true,
  legalName: true,
  orgNumber: true,
  streetAddress: true,
  postalCode: true,
  city: true,
  country: true,
  website: true,
  contactEmail: true,
  contactPhone: true,
  timeZone: true,
  emailDomain: true,
  domainJoin: true,
  archiveRetentionDays: true,
} as const;

/** What `organizationProfile.get` returns before the row exists (a query never creates it). */
export const EMPTY_ORGANIZATION_PROFILE: OrganizationProfileDto = {
  id: null,
  setupStatus: "PENDING",
  legalName: null,
  orgNumber: null,
  streetAddress: null,
  postalCode: null,
  city: null,
  country: "SE",
  website: null,
  contactEmail: null,
  contactPhone: null,
  timeZone: FALLBACK_TIME_ZONE,
  emailDomain: null,
  domainJoin: true,
  archiveRetentionDays: DEFAULT_ARCHIVE_RETENTION_DAYS,
};

export type LoadOrganizationProfileInput = { context: Pick<OperationContext, "db"> };

/** The organization's profile, or `null` when it has none yet (`scopedDb` pins the org). */
export async function loadOrganizationProfile({
  context,
}: LoadOrganizationProfileInput): Promise<OrganizationProfileDto | null> {
  return context.db.organizationProfile.findFirst({ select: ORGANIZATION_PROFILE_SELECT });
}
