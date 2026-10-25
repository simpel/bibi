import { listMembers } from "../../features/member/operations";
import { getUserSettings } from "../../features/user-settings/operations";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import type { DemoOrg } from "./types";

export type CheckDemoUserSettingsInput = { context: ExecuteContext; org: DemoOrg };

type Member = { name: string; userId: string };

const formatsOf = ({ org, member }: { org: DemoOrg; member: Member }) => {
  const formats = org.users.find((user) => user.name === member.name)?.displayFormats;
  return keyOf({ formats: formats ?? {} });
};

type Formats = Partial<
  Record<"dateFormat" | "clockFormat" | "numberFormat" | "currencyDisplay", string | null>
>;

/** `date/clock/number/currency`, `null` for a default. */
const keyOf = ({ formats }: { formats: Formats }) =>
  [formats.dateFormat, formats.clockFormat, formats.numberFormat, formats.currencyDisplay]
    .map((value) => value ?? null)
    .join("/");

/** ADR 0046, #482: each user has the formats in the data files, read as that user; the rest none. */
export async function checkDemoUserSettings({
  context,
  org,
}: CheckDemoUserSettingsInput): Promise<string[]> {
  const members = await execute({ operation: listMembers, input: { limit: 100 }, context });
  if (!members.ok) return [`${org.slug}: could not read members`];
  const failures: string[] = [];
  for (const member of members.value.items) {
    const own = createExecuteContext({
      organizationId: context.organizationId,
      roles: [],
      permissions: grantAll({}),
      actor: { type: "user", userId: member.userId },
    });
    const settings = await execute({ operation: getUserSettings, input: {}, context: own });
    const got = settings.ok ? keyOf({ formats: settings.value }) : "none";
    const want = formatsOf({ org, member });
    if (got !== want) failures.push(`${org.slug}: ${member.name} has formats ${got}, want ${want}`);
  }
  return failures;
}
