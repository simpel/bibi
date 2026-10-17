import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { createOrgApiKey, ROLE_PERMISSIONS, resolveExecuteContext } from "../src/index";
import { codeOf, createOrg, signUp } from "./helpers";
import { addMember } from "./roles";

const resolveKey = async ({ key }: { key: string }) => {
  const result = await resolveExecuteContext({ headers: new Headers({ "x-api-key": key }) });
  if (!result.ok) throw result.error;
  return result.value;
};

describe("API keys with fixed roles (ADR 0034)", () => {
  it("acts with the weaker of the key's role and the member's live role", async () => {
    const owner = await signUp();
    const organizationId = await createOrg({ headers: owner.headers });
    const staff = await signUp();
    await addMember({ organizationId, userId: staff.userId, role: "admin" });
    const created = await createOrgApiKey({
      headers: staff.headers,
      organizationId,
      name: "a",
      role: "admin",
    });
    if (!created.ok) throw created.error;
    await getDb().member.updateMany({
      where: { organizationId, userId: staff.userId },
      data: { role: "member" },
    });
    const context = await resolveKey({ key: created.value.key });
    expect(context.roles).toEqual(["member"]);
    expect(context.permissions).toEqual(ROLE_PERMISSIONS.member);
  });

  it("never issues an owner key or one above the member's role", async () => {
    const owner = await signUp();
    const organizationId = await createOrg({ headers: owner.headers });
    const asOwner = await createOrgApiKey({
      headers: owner.headers,
      organizationId,
      name: "o",
      role: "owner" as "admin",
    });
    expect(codeOf({ result: asOwner })).toBe("FORBIDDEN");
    const staff = await signUp();
    await addMember({ organizationId, userId: staff.userId, role: "member" });
    const above = await createOrgApiKey({
      headers: staff.headers,
      organizationId,
      name: "m",
      role: "admin",
    });
    expect(codeOf({ result: above })).toBe("FORBIDDEN");
  });
});
