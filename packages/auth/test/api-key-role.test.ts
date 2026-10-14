import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS, resolveExecuteContext } from "../src/index";
import { issueKey, issueKeyOrThrow, keyHeaders } from "./api-key-helpers";
import { codeOf, createOrg, signUp } from "./helpers";
import { memberSession } from "./roles";

const resolveKey = async ({ key }: { key: string }) => {
  const result = await resolveExecuteContext({ headers: keyHeaders({ key }) });
  if (!result.ok) throw result.error;
  return result.value;
};

describe("API keys with fixed roles (ADR 0034)", () => {
  it("acts with the weaker of the key's role and the member's live role", async () => {
    const { user, organizationId, headers } = await memberSession({ role: "admin" });
    const { key } = await issueKeyOrThrow({ headers, role: "admin" });
    await getDb().member.updateMany({
      where: { organizationId, userId: user.userId },
      data: { role: "member" },
    });
    const context = await resolveKey({ key });
    expect(context.roles).toEqual(["member"]);
    expect(context.permissions).toEqual(ROLE_PERMISSIONS.member);
  });

  it("never issues an owner key or one above the creating admin's role", async () => {
    const owner = await signUp();
    await createOrg({ headers: owner.headers });
    const asOwner = await issueKey({ headers: owner.headers, role: "owner" });
    expect(codeOf({ result: asOwner })).toBe("VALIDATION");
    const { headers } = await memberSession({ role: "member" });
    // A member cannot manage keys at all; an admin can, up to admin.
    expect(codeOf({ result: await issueKey({ headers, role: "viewer" }) })).toBe("FORBIDDEN");
  });

  it("can only be created from a web session, not with an API key", async () => {
    const owner = await signUp();
    await createOrg({ headers: owner.headers });
    const { key } = await issueKeyOrThrow({ headers: owner.headers, role: "admin" });
    const viaKey = await issueKey({ headers: keyHeaders({ key }), role: "viewer" });
    expect(codeOf({ result: viaKey })).toBe("FORBIDDEN");
  });
});
