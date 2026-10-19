import {
  createVenue,
  execute,
  getVenue,
  PRESET_PERMISSIONS,
  removeMember,
  revokeApiKey,
  updatePermissions,
} from "@okazi/core";
import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { resolveExecuteContext } from "../src/index";
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
  it("resolves org, preset and the key as actor from x-api-key and Bearer okz_", async () => {
    const { organizationId, key, id } = await ownerWithKey();
    expect(key.startsWith("okz_")).toBe(true);
    const viaHeader = await resolveExecuteContext({ headers: keyHeaders({ key }) });
    const viaBearer = await resolveExecuteContext({
      headers: new Headers({ authorization: `Bearer ${key}` }),
    });
    for (const result of [viaHeader, viaBearer] as Resolved[]) {
      if (!result.ok) throw result.error;
      expect(result.value.organizationId).toBe(organizationId);
      expect(result.value.roles).toEqual(["admin"]);
      expect(result.value.permissions).toEqual(PRESET_PERMISSIONS.admin);
      expect(result.value.actor).toEqual({ type: "apiKey", userId: null, apiKeyId: id });
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

  it("refuses a key without a valid preset", async () => {
    const { key, id } = await ownerWithKey();
    const metadata = JSON.stringify({ createdBy: "someone" });
    await getDb().apikey.update({ where: { id }, data: { metadata } });
    const result = await resolveExecuteContext({ headers: keyHeaders({ key }) });
    expect(codeOf({ result })).toBe("FORBIDDEN");
  });

  it("applies the key's own overrides and outlives the admin who created it", async () => {
    const { owner, user, organizationId, headers } = await memberSession({ role: "admin" });
    const { key, id } = await issueKeyOrThrow({ headers, role: "member" });
    const admin = await resolveExecuteContext({ headers: owner.headers });
    if (!admin.ok) throw admin.error;
    const overrides = [
      { feature: "venue" as const, action: "create" as const, effect: "allow" as const },
    ];
    const input = { subjectType: "apiKey" as const, subjectId: id, overrides };
    expect(
      codeOf({
        result: await execute({ operation: updatePermissions, input, context: admin.value }),
      }),
    ).toBe("OK");
    const member = await getDb().member.findFirstOrThrow({
      where: { organizationId, userId: user.userId },
    });
    const removed = await execute({
      operation: removeMember,
      input: { id: member.id },
      context: admin.value,
    });
    expect(codeOf({ result: removed })).toBe("OK");
    const venue = await execute({
      operation: createVenue,
      input: { name: "Via key" },
      context: await resolveKey({ key }),
    });
    expect(codeOf({ result: venue })).toBe("OK");
    const audit = await getDb().auditLog.findFirst({
      where: { operation: "venue.create", organizationId },
    });
    expect(audit).toMatchObject({ actorType: "API_KEY", actorId: id });
  });
});
