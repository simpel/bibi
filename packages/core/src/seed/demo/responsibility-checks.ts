import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoResponsibilitiesInput = { context: ExecuteContext; org: DemoOrg };

const byPosition = { orderBy: { position: "asc" } } as const;

const same = ({ actual, expected }: { actual: readonly string[]; expected: readonly string[] }) =>
  actual.join("|") === expected.join("|");

/**
 * Slice 2 and ADR 0056: each responsibility's join rows name the data files' covered item types
 * and default followers, in order.
 */
export async function checkDemoResponsibilities({
  context,
  org,
}: CheckDemoResponsibilitiesInput): Promise<string[]> {
  const failures: string[] = [];
  const members = await context.db.member.findMany({
    select: { userId: true, user: { select: { name: true } } },
  });
  const userName = new Map(members.map((member) => [member.userId, member.user.name]));
  for (const { name, types, followers = [] } of org.responsibilities) {
    const row = await context.db.responsibility.findFirst({
      where: { name },
      include: {
        entityTypes: { select: { entityType: { select: { name: true } } }, ...byPosition },
        defaultFollowers: { select: { userId: true }, ...byPosition },
      },
    });
    if (!row) {
      failures.push(`${org.slug}: no responsibility ${name}`);
      continue;
    }
    const covered = row.entityTypes.map((link) => link.entityType.name);
    if (!same({ actual: covered, expected: types })) {
      failures.push(`${org.slug}: ${name} covers ${covered.join(", ")}`);
    }
    const following = row.defaultFollowers.map((link) => userName.get(link.userId) ?? link.userId);
    if (!same({ actual: following, expected: followers })) {
      failures.push(`${org.slug}: ${name} is followed by ${following.join(", ")}`);
    }
  }
  return failures;
}
