import { getOrganizationProfile } from "../../features/organization-profile/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";
import { demoEmailDomain } from "./users";

export type CheckDemoDomainJoinInput = { context: ExecuteContext; org: DemoOrg };

/** ADR 0076: the first admin claimed the demo domain at creation and domain join is on. */
export async function checkDemoDomainJoin({
  context,
  org,
}: CheckDemoDomainJoinInput): Promise<string[]> {
  const profile = await execute({ operation: getOrganizationProfile, input: {}, context });
  if (!profile.ok) return [`${org.slug}: could not read the email domain`];
  const expected = demoEmailDomain({ org });
  const { emailDomain, domainJoin } = profile.value;
  if (emailDomain === expected && domainJoin) return [];
  return [
    `${org.slug}: domain join ${domainJoin ? "on" : "off"} for ${emailDomain}, expected ${expected}`,
  ];
}
