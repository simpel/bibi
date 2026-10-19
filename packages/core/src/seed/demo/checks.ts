import { listMembers } from "../../features/member/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { checkDemoArchive } from "./archive-checks";
import { checkDemoAssignments } from "./assignment-checks";
import { checkDemoBoard } from "./board-checks";
import { checkDemoConfig } from "./config-checks";
import { checkDemoGrid } from "./grid-checks";
import { checkDemoHolds } from "./hold-checks";
import { checkDemoPipeline } from "./pipeline-checks";
import { checkDemoQuoteEvents } from "./quote-event-checks";
import { reconcileProjections } from "./reconcile-checks";
import { checkDemoSetupNeed } from "./setup-need-checks";
import { checkDemoTemplates } from "./template-checks";
import { checkDemoTickets } from "./ticket-checks";
import type { DemoOrg } from "./types";

export type CheckDemoOrgInput = { context: ExecuteContext; org: DemoOrg; skipPipeline?: boolean };

/**
 * The checks in `docs/demo-seed.md` that slices 1–5 can verify: the member count, everyone
 * has their documented role, the configuration and items (`checkDemoConfig`), the pipeline (`checkDemoPipeline`: phases,
 * states and grid cells), the predefined tickets and the tickets made from them
 * (`checkDemoTemplates`) and the tickets per phase (`checkDemoTickets`), the tickets' assignees and followers
 * (`checkDemoAssignments`), that removing a populated phase or state with a target is allowed
 * (`checkDemoArchive`, run before the grid checks move tickets), the lines' soft holds and their expiry (`checkDemoHolds`), the phase
 * quote events that moved the tickets (`checkDemoQuoteEvents`), the phase
 * moves the grid drives (`checkDemoGrid`), every projection against its owned data
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
  failures.push(...(await checkDemoConfig({ context, org, skipPipeline })));
  failures.push(...(await checkDemoSetupNeed({ context, org, skipPipeline })));
  if (skipPipeline) return [...failures, ...(await auditFailures({ context, org }))];
  failures.push(...(await checkDemoPipeline({ context, org })));
  failures.push(...(await checkDemoTemplates({ context, org })));
  failures.push(...(await checkDemoTickets({ context, org })));
  failures.push(...(await checkDemoBoard({ context, org })));
  failures.push(...(await checkDemoAssignments({ context, org })));
  failures.push(...(await checkDemoHolds({ context, org })));
  failures.push(...(await checkDemoArchive({ context, org })));
  failures.push(...(await checkDemoQuoteEvents({ context, org })));
  failures.push(...(await checkDemoGrid({ context, org })));
  failures.push(...(await reconcileProjections({ context })));
  return [...failures, ...(await auditFailures({ context, org }))];
}

/** Check 7 (ADR 0025): every write (organization-scoped) must have an audit row as SYSTEM. */
async function auditFailures({ context, org }: CheckDemoOrgInput): Promise<string[]> {
  const notSystem = await context.db.auditLog.count({
    where: { organizationId: context.organizationId, actorType: { not: "SYSTEM" } },
  });
  return notSystem > 0 ? [`${org.slug}: ${notSystem} audit rows not by SYSTEM`] : [];
}
