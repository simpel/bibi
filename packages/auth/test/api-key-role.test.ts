import { PRESET_PERMISSIONS } from "@bibi/core";
import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { resolveExecuteContext } from "../src/index";
import { issueKey, issueKeyOrThrow, keyHeaders } from "./api-key-helpers";
import { codeOf, createOrg, signUp } from "./helpers";
import { memberSession } from "./roles";

const resolveKey = async ({ key }: { key: string }) => {
  const result = await resolveExecuteContext({ headers: keyHeaders({ key }) });
  if (!result.ok) throw result.error;
  return result.value;
};

describe("API keys with presets (ADR 0050)", () => {
  it("acts with its own preset, whatever its creator's role becomes", async () => {
    const { user, organizationId, headers } = await memberSession({ role: "admin" });
    const { key } = await issueKeyOrThrow({ headers, role: "admin" });
    await getDb().member.updateMany({
      where: { organizationId, userId: user.userId },
      data: { role: "member" },
    });
    const context = await resolveKey({ key });
    expect(context.roles).toEqual(["admin"]);
    expect(context.permissions).toEqual(PRESET_PERMISSIONS.admin);
  });

  it("never issues an unknown preset, and only admins issue keys", async () => {
    const owner = await signUp();
    await createOrg({ headers: owner.headers });
    const asOwner = await issueKey({ headers: owner.headers, role: "owner" });
    expect(codeOf({ result: asOwner })).toBe("VALIDATION");
    const { headers } = await memberSession({ role: "manager" });
    // API keys are admin-only (ADR 0050).
    expect(codeOf({ result: await issueKey({ headers, role: "member" }) })).toBe("FORBIDDEN");
  });

  it("can only be created from a web session, not with an API key", async () => {
    const owner = await signUp();
    await createOrg({ headers: owner.headers });
    const { key } = await issueKeyOrThrow({ headers: owner.headers, role: "admin" });
    const viaKey = await issueKey({ headers: keyHeaders({ key }), role: "member" });
    expect(codeOf({ result: viaKey })).toBe("FORBIDDEN");
  });
});
