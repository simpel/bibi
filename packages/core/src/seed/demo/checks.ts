import { listMembers } from "../../features/member/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { checkDemoAllocations } from "./allocation-checks";
import { checkDemoAlternatives } from "./alternative-checks";
import { checkDemoArchive } from "./archive-checks";
import { checkDemoAssignments } from "./assignment-checks";
import { checkDemoBoard } from "./board-checks";
import { checkDemoBuffers } from "./buffer-checks";
import { checkDemoBundles } from "./bundle-checks";
import { checkDemoConfig } from "./config-checks";
import { checkDemoCustomisations } from "./customisation-checks";
import { checkDemoFactGuards } from "./fact-guard-checks";
import { checkDemoGrid } from "./grid-checks";
import { checkDemoHolds } from "./hold-checks";
import { checkDemoMemberProfiles } from "./member-profile-checks";
import { checkDemoPayments } from "./payment-checks";
import { checkDemoPermissions } from "./permission-checks";
import { checkDemoPipeline } from "./pipeline-checks";
import { checkDemoPools } from "./pool-checks";
import { checkDemoPrices } from "./price-checks";
import { checkDemoQuoteEvents } from "./quote-event-checks";
import { reconcileProjections } from "./reconcile-checks";
import { checkDemoRecords } from "./record-checks";
import { checkDemoResponsibilities } from "./responsibility-checks";
import { checkDemoSetupNeed } from "./setup-need-checks";
import { checkDemoTemplates } from "./template-checks";
import { checkDemoTickets } from "./ticket-checks";
import { checkDemoTimeZones } from "./time-zone-checks";
import type { DemoOrg } from "./types";

type OrgCheck = (input: { context: ExecuteContext; org: DemoOrg }) => Promise<string[]>;

/** The checks that need the pipeline, in order (the archive checks run before the grid moves). */
const PIPELINE_CHECKS: readonly OrgCheck[] = [
  checkDemoPipeline,
  checkDemoTemplates,
  checkDemoTickets,
  checkDemoBoard,
  checkDemoAssignments,
  checkDemoHolds,
  checkDemoAlternatives,
  checkDemoArchive,
  checkDemoQuoteEvents,
  checkDemoFactGuards,
  checkDemoGrid,
  checkDemoPrices,
  checkDemoBundles,
  checkDemoBuffers,
  checkDemoAllocations,
  checkDemoPayments,
];

export type CheckDemoOrgInput = { context: ExecuteContext; org: DemoOrg; skipPipeline?: boolean };

/**
 * The checks in `docs/demo-seed.md` that slices 1–5 can verify: the member count, everyone
 * has their documented role, the configuration and items (`checkDemoConfig`), the responsibilities' id lists (`checkDemoResponsibilities`), that a refused field archive lists its records (`checkDemoRecords`), the pipeline (`checkDemoPipeline`: statuses,
 * states and grid cells), the predefined tickets and the tickets made from them
 * (`checkDemoTemplates`) and the tickets per status (`checkDemoTickets`), the tickets' assignees and followers
 * (`checkDemoAssignments`), that removing a populated status or state with a target is allowed
 * (`checkDemoArchive`, run before the grid checks move tickets), the lines' soft holds and their expiry (`checkDemoHolds`), the alternative groups' holds before and after the customer's pick (`checkDemoAlternatives`, ADR 0052), the status
 * quote events that moved the tickets (`checkDemoQuoteEvents`), that a status requiring an
 * accepted quote refuses a ticket without one (`checkDemoFactGuards`, ADR 0054), the status
 * moves the grid drives (`checkDemoGrid`), every line's effective price and inherited quantity
 * (`checkDemoPrices`, ADR 0052), the expanded bundles' part lines and per-rate VAT
 * (`checkDemoBundles`, ADR 0059), every line's setup and teardown buffers (`checkDemoBuffers`, ADR
 * 0059), the allocated units' holds (`checkDemoAllocations`, ADR 0059), the derived balances (`checkDemoPayments`, ADR 0057), the organization's and venue's zones (`checkDemoTimeZones`, ADR 0064), every projection against its owned data
 * (`reconcileProjections`, ADR 0051), and every write
 * was audited as SYSTEM. Returns failure messages.
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
  failures.push(...(await checkDemoMemberProfiles({ context, org })));
  failures.push(...(await checkDemoCustomisations({ context, org })));
  failures.push(...(await checkDemoResponsibilities({ context, org })));
  failures.push(...(await checkDemoRecords({ context, org })));
  failures.push(...(await checkDemoSetupNeed({ context, org, skipPipeline })));
  failures.push(...(await checkDemoTimeZones({ context, org })));
  if (skipPipeline) return [...failures, ...(await auditFailures({ context, org }))];
  for (const check of PIPELINE_CHECKS) failures.push(...(await check({ context, org })));
  failures.push(...(await reconcileProjections({ context })));
  return [...failures, ...(await auditFailures({ context, org }))];
}

/** Entities the seed writes as each user, because `self:*` operations refuse SYSTEM. */
const SELF_SEEDED = ["profile", "workingHours"] as const;

/**
 * Check 7 (ADR 0025): every write must have an audit row as SYSTEM, except each user's own
 * profile and hours (ADR 0061), which `self:*` operations save as that user.
 */
async function auditFailures({ context, org }: CheckDemoOrgInput): Promise<string[]> {
  const notSystem = await context.db.auditLog.count({
    where: {
      organizationId: context.organizationId,
      actorType: { not: "SYSTEM" },
      NOT: { actorType: "USER", entityType: { in: [...SELF_SEEDED] } },
    },
  });
  return notSystem > 0 ? [`${org.slug}: ${notSystem} audit rows not by SYSTEM`] : [];
}
