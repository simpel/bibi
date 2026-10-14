import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { createApiKey, execute, listApiKeys, removeMember } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { addTestMemberWithUser, testOrg } from "./org-helpers";

describe("member.remove revokes the member's API keys (#92)", () => {
  it("disables and audits the removed member's keys and keeps everyone else's", async () => {
    const owner = await testOrg();
    const { memberId, userId } = await addTestMemberWithUser({ context: owner, role: "admin" });
    const admin = testContext({
      organizationId: owner.organizationId,
      actor: { type: "user", userId },
    });
    const asAdmin = { ...admin, roles: ["admin"], credential: "session" as const };
    const input = { name: "Leaver", role: "member" };
    const leaver = unwrap({
      result: await execute({ operation: createApiKey, input, context: asAdmin }),
    });
    const ownerSession = { ...owner, credential: "session" as const };
    const stays = unwrap({
      result: await execute({
        operation: createApiKey,
        input: { name: "Stays", role: "viewer" },
        context: ownerSession,
      }),
    });
    unwrap({
      result: await execute({ operation: removeMember, input: { id: memberId }, context: owner }),
    });
    const row = await getDb().apikey.findUniqueOrThrow({ where: { id: leaver.apiKey.id } });
    expect(row.enabled).toBe(false);
    const list = unwrap({
      result: await execute({ operation: listApiKeys, input: {}, context: owner }),
    });
    expect(list.items.map((key) => key.id)).toEqual([stays.apiKey.id]);
    const audit = await owner.db.auditLog.findFirst({
      where: { operation: "member.remove", entityType: "apiKey" },
    });
    expect(audit).toMatchObject({ entityId: leaver.apiKey.id });
    expect(JSON.stringify(audit)).not.toContain(leaver.secret);
  });
});
