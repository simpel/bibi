import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  createApiKey,
  type ExecuteContext,
  execute,
  getApiKey,
  hashApiKey,
  listApiKeys,
  PRESET_PERMISSIONS,
  revokeApiKey,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { testOrg } from "./org-helpers";

/** `apiKey.create` accepts only a web session (ADR 0005, #90). */
const session = ({ context }: { context: ExecuteContext }): ExecuteContext => ({
  ...context,
  credential: "session",
});

type CreateInput = { context: ExecuteContext; role?: string };

const create = ({ context, role = "manager" }: CreateInput) =>
  execute({ operation: createApiKey, input: { name: "CRM", role }, context: session({ context }) });

describe("apiKey operations (ADR 0005)", () => {
  it("returns the secret once, stores only its hash and keeps it out of the audit", async () => {
    const context = await testOrg();
    const created = unwrap({ result: await create({ context }) });
    expect(created.secret).toMatch(/^okz_[a-zA-Z]{64}$/);
    expect(created.apiKey).toMatchObject({ name: "CRM", role: "manager" });
    expect(created.apiKey.start).toBe(created.secret.slice(0, 6));
    const row = await getDb().apikey.findUniqueOrThrow({ where: { id: created.apiKey.id } });
    expect(row.organizationId).toBe(context.organizationId);
    expect(row.key).toBe(hashApiKey({ key: created.secret }));
    const audit = await context.db.auditLog.findFirst({ where: { operation: "apiKey.create" } });
    expect(audit).toMatchObject({ entityType: "apiKey", entityId: created.apiKey.id });
    expect(JSON.stringify(audit)).not.toContain(created.secret);
    expect(JSON.stringify(audit)).not.toContain(row.key);
  });

  it("lists active keys without secrets and revokes them", async () => {
    const context = await testOrg();
    const { apiKey, secret } = unwrap({ result: await create({ context }) });
    const list = unwrap({ result: await execute({ operation: listApiKeys, input: {}, context }) });
    expect(list.items.map((key) => key.id)).toEqual([apiKey.id]);
    expect(JSON.stringify(list)).not.toContain(secret);
    const revoked = await execute({ operation: revokeApiKey, input: { id: apiKey.id }, context });
    expect(unwrap({ result: revoked }).id).toBe(apiKey.id);
    const after = unwrap({ result: await execute({ operation: listApiKeys, input: {}, context }) });
    expect(after.items).toEqual([]);
    const again = await execute({ operation: revokeApiKey, input: { id: apiKey.id }, context });
    expect(errorCode({ result: again })).toBe("NOT_FOUND");
  });

  it("reads one enabled key, and not after revoke or from another organization", async () => {
    const context = await testOrg();
    const { apiKey } = unwrap({ result: await create({ context }) });
    const get = ({ context: ctx }: { context: ExecuteContext }) =>
      execute({ operation: getApiKey, input: { id: apiKey.id }, context: ctx });
    expect(unwrap({ result: await get({ context }) })).toMatchObject({
      id: apiKey.id,
      name: "CRM",
      role: "manager",
    });
    expect(errorCode({ result: await get({ context: await testOrg() }) })).toBe("NOT_FOUND");
    unwrap({
      result: await execute({ operation: revokeApiKey, input: { id: apiKey.id }, context }),
    });
    expect(errorCode({ result: await get({ context }) })).toBe("NOT_FOUND");
  });

  it("refuses unknown presets, and callers without apiKey:write", async () => {
    const owner = await testOrg();
    const admin = { ...owner, roles: ["admin"] };
    for (const role of ["owner", "Sales"]) {
      expect(errorCode({ result: await create({ context: admin, role }) })).toBe("VALIDATION");
    }
    expect(errorCode({ result: await create({ context: admin, role: "admin" }) })).toBeNull();
    // API keys are admin-only (ADR 0050): the manager preset has no apiKey:write.
    const manager = { ...owner, roles: ["manager"], permissions: PRESET_PERMISSIONS.manager };
    expect(errorCode({ result: await create({ context: manager, role: "member" }) })).toBe(
      "FORBIDDEN",
    );
  });

  it("needs integration:admin and stays inside the organization", async () => {
    const context = await testOrg();
    const writer = testContext({ organizationId: context.organizationId, access: "write" });
    expect(errorCode({ result: await create({ context: writer }) })).toBe("FORBIDDEN");
    const { apiKey } = unwrap({ result: await create({ context }) });
    const other = testContext();
    const list = unwrap({
      result: await execute({ operation: listApiKeys, input: {}, context: other }),
    });
    expect(list.items).toEqual([]);
    const revoke = await execute({
      operation: revokeApiKey,
      input: { id: apiKey.id },
      context: other,
    });
    expect(errorCode({ result: revoke })).toBe("NOT_FOUND");
  });
});

describe("apiKey.create callers (#88, #90)", () => {
  it("is marked unavailable to the AI actor and refuses it even with approval", async () => {
    expect(createApiKey.aiAllowed).toBe(false);
    const context = await testOrg();
    const ai = session({
      context: {
        ...context,
        actor: { type: "ai", userId: "user_ai", conversationId: "c", approvedBy: "user_ai" },
      },
    });
    const result = await execute({
      operation: createApiKey,
      input: { name: "x", role: "member" },
      context: ai,
    });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });

  it("accepts only a web session, never an OAuth token, an API key or no credential", async () => {
    const context = await testOrg();
    for (const credential of ["accessToken", "apiKey", undefined] as const) {
      const caller = { ...context, ...(credential ? { credential } : {}) };
      const input = { name: "x", role: "member" };
      const result = await execute({ operation: createApiKey, input, context: caller });
      expect(errorCode({ result }), String(credential)).toBe("FORBIDDEN");
    }
    expect(await getDb().apikey.count({ where: { organizationId: context.organizationId } })).toBe(
      0,
    );
  });
});
