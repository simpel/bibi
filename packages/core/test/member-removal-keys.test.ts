import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { createApiKey, execute, removeMember, updatePermissions } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { addTestMemberWithUser, testOrg } from "./org-helpers";

describe("member.remove and API keys (ADR 0050)", () => {
  it("keeps the keys a removed admin created and archives their overrides", async () => {
    const owner = await testOrg();
    // A second admin, so the leaver is not the organization's last one.
    await addTestMemberWithUser({ context: owner, role: "admin" });
    const { memberId, userId } = await addTestMemberWithUser({ context: owner, role: "admin" });
    const leaver = testContext({
      organizationId: owner.organizationId,
      actor: { type: "user", userId },
    });
    const asLeaver = { ...leaver, credential: "session" as const };
    const input = { name: "CRM", role: "manager" as const };
    const key = unwrap({
      result: await execute({ operation: createApiKey, input, context: asLeaver }),
    });
    const overrides = [
      { feature: "item" as const, action: "write" as const, effect: "allow" as const },
    ];
    unwrap({
      result: await execute({
        operation: updatePermissions,
        input: { subjectType: "member", subjectId: memberId, overrides },
        context: owner,
      }),
    });
    unwrap({
      result: await execute({ operation: removeMember, input: { id: memberId }, context: owner }),
    });
    const row = await getDb().apikey.findUniqueOrThrow({ where: { id: key.apiKey.id } });
    expect(row.enabled).toBe(true);
    const active = await getDb().permissionOverride.count({
      where: { subjectId: memberId, status: "ACTIVE" },
    });
    expect(active).toBe(0);
  });
});
