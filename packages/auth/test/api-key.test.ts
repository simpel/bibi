import { createVenue, execute, getVenue, removeMember, revokeApiKey } from "@okazi/core";
import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS, resolveExecuteContext } from "../src/index";
import { issueKey, issueKeyOrThrow, keyHeaders } from "./api-key-helpers";
import { codeOf, createOrg, signUp } from "./helpers";
import { memberSession } from "./roles";

type Resolved = Awaited<ReturnType<typeof resolveExecuteContext>>;

const ownerWithKey = async ({ role = "admin" }: { role?: string } = {}) => {
  const owner = await signUp();
  const organizationId = await createOrg({ headers: owner.headers });
  const { key, id } = await issueKeyOrThrow({ headers: owner.headers, role });
  return { owner, organizationId, key, id };
};

const resolveKey = async ({ key }: { key: string }) => {
  const result = await resolveExecuteContext({ headers: keyHeaders({ key }) });
  if (!result.ok) throw result.error;
  return result.value;
};

describe("resolveExecuteContext – API keys", () => {
  it("resolves org, owner and key role from x-api-key and Bearer okz_", async () => {
    const { owner, organizationId, key } = await ownerWithKey();
    expect(key.startsWith("okz_")).toBe(true);
    const viaHeader = await resolveExecuteContext({ headers: keyHeaders({ key }) });
    const viaBearer = await resolveExecuteContext({
      headers: new Headers({ authorization: `Bearer ${key}` }),
    });
    for (const result of [viaHeader, viaBearer] as Resolved[]) {
      if (!result.ok) throw result.error;
      expect(result.value.organizationId).toBe(organizationId);
      expect(result.value.roles).toEqual(["admin"]);
      expect(result.value.permissions).toEqual(ROLE_PERMISSIONS.admin);
      expect(result.value.actor).toEqual({ type: "user", userId: owner.userId });
      expect(result.value.credential).toBe("apiKey");
    }
  });

  it("rejects unknown and revoked keys at once", async () => {
    const result = await resolveExecuteContext({ headers: keyHeaders({ key: "okz_nope" }) });
    expect(codeOf({ result })).toBe("UNAUTHENTICATED");
    const { owner, key, id } = await ownerWithKey();
    const session = await resolveExecuteContext({ headers: owner.headers });
    if (!session.ok) throw session.error;
    const revoked = await execute({
      operation: revokeApiKey,
      input: { id },
      context: session.value,
    });
    expect(codeOf({ result: revoked })).toBe("OK");
    const after = await resolveExecuteContext({ headers: keyHeaders({ key }) });
    expect(codeOf({ result: after })).toBe("UNAUTHENTICATED");
  });

  it("cannot read another organization's data", async () => {
    const { key } = await ownerWithKey();
    const other = await ownerWithKey();
    const venue = await execute({
      operation: createVenue,
      input: { name: "B" },
      context: await resolveKey({ key: other.key }),
    });
    if (!venue.ok) throw venue.error;
    const read = await execute({
      operation: getVenue,
      input: { id: venue.value.id },
      context: await resolveKey({ key }),
    });
    expect(codeOf({ result: read })).toBe("NOT_FOUND");
  });

  it("refuses a key whose owner is not a member of its organization", async () => {
    const { key, id } = await ownerWithKey();
    const stranger = await signUp();
    // A key tampered to name another owner grants nothing at resolve time.
    const metadata = JSON.stringify({ userId: stranger.userId, role: "admin" });
    await getDb().apikey.update({ where: { id }, data: { metadata } });
    const result = await resolveExecuteContext({ headers: keyHeaders({ key }) });
    expect(codeOf({ result })).toBe("FORBIDDEN");
  });

  it("caps the key at the member's role and stops it when the member is removed", async () => {
    const { owner, user, organizationId, headers } = await memberSession({ role: "viewer" });
    expect(codeOf({ result: await issueKey({ headers, role: "member" }) })).toBe("FORBIDDEN");
    // A viewer has no `integration:admin`: only admins and owners manage keys (ADR 0034).
    expect(codeOf({ result: await issueKey({ headers, role: "viewer" }) })).toBe("FORBIDDEN");
    await getDb().member.updateMany({
      where: { organizationId, userId: user.userId },
      data: { role: "admin" },
    });
    const { key } = await issueKeyOrThrow({ headers, role: "viewer" });
    const write = await execute({
      operation: createVenue,
      input: { name: "no" },
      context: await resolveKey({ key }),
    });
    expect(codeOf({ result: write })).toBe("FORBIDDEN");
    const member = await getDb().member.findFirstOrThrow({
      where: { organizationId, userId: user.userId },
    });
    const ownerContext = await resolveExecuteContext({ headers: owner.headers });
    if (!ownerContext.ok) throw ownerContext.error;
    const removed = await execute({
      operation: removeMember,
      input: { id: member.id },
      context: ownerContext.value,
    });
    expect(codeOf({ result: removed })).toBe("OK");
    // member.remove revokes the key (#92), so it is unknown now, not just powerless.
    expect(codeOf({ result: await resolveExecuteContext({ headers: keyHeaders({ key }) }) })).toBe(
      "UNAUTHENTICATED",
    );
  });
});
