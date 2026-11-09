import { listMembers } from "../../features/member/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { checkDemoConfig } from "./config-checks";
import { checkDemoCustomisations } from "./customisation-checks";
import { checkDemoDomainJoin } from "./domain-join-checks";
import { checkDemoFloorPlans } from "./floor-plan-checks";
import { checkDemoHours } from "./hours-checks";
import { checkDemoMemberProfiles } from "./member-profile-checks";
import { checkDemoPermissions } from "./permission-checks";
import { PIPELINE_CHECKS } from "./pipeline-check-list";
import { checkDemoPools } from "./pool-checks";
import { reconcileProjections } from "./reconcile-checks";
import { checkDemoRecords } from "./record-checks";
import { checkDemoResponsibilities } from "./responsibility-checks";
import { checkDemoSetupNeed } from "./setup-need-checks";
import { checkDemoSimilarCustomers } from "./similar-customer-checks";
import { checkDemoTimeZones } from "./time-zone-checks";
import type { DemoOrg } from "./types";
import { checkDemoUserSettings } from "./user-settings-checks";

export type CheckDemoOrgInput = { context: ExecuteContext; org: DemoOrg; skipPipeline?: boolean };

/**
 * The checks in `docs/demo-seed.md` that slices 1–5 can verify: the member count, everyone has their documented role, the configuration and items (`checkDemoConfig`), the responsibilities' id lists (`checkDemoResponsibilities`), that a refused field archive lists its records (`checkDemoRecords`), the pipeline (`checkDemoPipeline`: statuses,
 * states and grid cells), the predefined orders and the orders made from them
 * (`checkDemoTemplates`) and the orders per status (`checkDemoOrders`), the orders' assignees and followers
 * (`checkDemoAssignments`), that removing a populated status or state with a target is allowed
 * (`checkDemoArchive`, run before the grid checks move orders), the lines' soft holds and their expiry (`checkDemoHolds`), the alternative groups' holds before and after the customer's pick (`checkDemoAlternatives`, ADR 0052), the status
 * quote events that moved the orders (`checkDemoQuoteEvents`), that a status requiring an
 * accepted quote refuses an order without one (`checkDemoFactGuards`, ADR 0054), the status
 * moves the grid drives (`checkDemoGrid`), every line's effective price and inherited quantity
 * (`checkDemoPrices`, ADR 0052), the expanded bundles' part lines and per-rate VAT
 * (`checkDemoBundles`, ADR 0059), every line's setup and teardown buffers (`checkDemoBuffers`, ADR
 * 0059), the allocated units' holds (`checkDemoAllocations`, ADR 0059), the derived balances (`checkDemoPayments`, ADR 0057), the invoices and SIE export (`checkDemoFinance`, ADR 0077), the organization's and venue's zones (`checkDemoTimeZones`, ADR 0064), the claimed email domain (`checkDemoDomainJoin`, ADR 0078), the duplicate suggestions (`checkDemoSimilarCustomers`, ADR 0081), every projection against its owned data
 * (`reconcileProjections`, ADR 0051), and every write was audited as SYSTEM. Returns failure messages.
 */
export async function checkDemoOrg({
  context,
  org,
  skipPipeline = false,
}: CheckDemoOrgInput): Promise<string[]> {
  const failures: string[] = [];
  const members = await execute({ operation: listMembers, input: { limit: 100 }, context });
  if (!members.ok) return [`${org.slug}: could not read members`];
  if (members.value.items.length !== org.users.length) {
    failures.push(
      `${org.slug}: ${members.value.items.length} members, expected ${org.users.length}`,
    );
  }
  for (const user of org.users) {
    const member = members.value.items.find((candidate) => candidate.name === user.name);
    if (member?.role !== user.role) {
      failures.push(`${org.slug}: ${user.name} has ${member ? member.role : "no member"}`);
    }
  }
  const listed = members.value.items;
  failures.push(...(await checkDemoPermissions({ context, org, members: listed })));
  failures.push(...(await checkDemoConfig({ context, org, skipPipeline })));
  failures.push(...(await checkDemoPools({ context, org })));
  failures.push(...(await checkDemoFloorPlans({ context, org })));
  failures.push(...(await checkDemoMemberProfiles({ context, org })));
  failures.push(...(await checkDemoCustomisations({ context, org })));
  failures.push(...(await checkDemoResponsibilities({ context, org })));
  failures.push(...(await checkDemoRecords({ context, org })));
  failures.push(...(await checkDemoSetupNeed({ context, org, skipPipeline })));
  failures.push(...(await checkDemoTimeZones({ context, org })));
  failures.push(...(await checkDemoDomainJoin({ context, org })));
  failures.push(...(await checkDemoHours({ context, org })));
  failures.push(...(await checkDemoUserSettings({ context, org })));
  failures.push(...(await checkDemoSimilarCustomers({ context, org })));
  if (skipPipeline) return [...failures, ...(await auditFailures({ context, org }))];
  for (const check of PIPELINE_CHECKS) failures.push(...(await check({ context, org })));
  failures.push(...(await reconcileProjections({ context })));
  return [...failures, ...(await auditFailures({ context, org }))];
}

/** Entities the seed writes as each user, because `self:*` operations refuse SYSTEM. */
const SELF_SEEDED = ["profile", "workingHours", "userSettings", "notification"] as const;

/**
 * Check 7 (ADR 0025): every write must have an audit row as SYSTEM, except each user's own
 * profile, hours, settings and read notifications (ADR 0061, 0046, 0094), which `self:*`
 * operations save as that user, and
 * the creator's claim of their email domain (ADR 0078), which a real signup makes as the creator.
 */
async function auditFailures({ context, org }: CheckDemoOrgInput): Promise<string[]> {
  const notSystem = await context.db.auditLog.count({
    where: {
      organizationId: context.organizationId,
      actorType: { not: "SYSTEM" },
      NOT: [
        { actorType: "USER", entityType: { in: [...SELF_SEEDED] } },
        { actorType: "USER", operation: "organizationProfile.setDomainJoin" },
      ],
    },
  });
  return notSystem > 0 ? [`${org.slug}: ${notSystem} audit rows not by SYSTEM`] : [];
}
