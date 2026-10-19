import { getEnv } from "@okazi/config";
import { createApiKey, type ExecuteContext, execute } from "@okazi/core";
import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { signApprovalToken } from "../src/approval/sign";
import { call, connect, testContext } from "./helpers";

/** A key in the context's organization, created as a web-session caller (#90). */
async function seedKey({ context }: { context: ExecuteContext }): Promise<string> {
  const created = await execute({
    operation: createApiKey,
    input: { name: "Secret sync", role: "member" },
    context: { ...context, credential: "session" },
  });
  if (!created.ok) throw created.error;
  return created.value.apiKey.id;
}

/** A live refresh token for `userId` and a fresh client in one organization (as Better Auth). */
async function seedGrant({ userId, organizationId }: { userId: string; organizationId: string }) {
  const db = getDb();
  await db.user.create({ data: { id: userId, name: "U", email: `${userId}@x.test` } });
  const clientId = `client_${createId()}`;
  const now = new Date();
  await db.oauthClient.create({
    data: { id: createId(), clientId, name: "Desktop", createdAt: now, updatedAt: now },
  });
  await db.oauthRefreshToken.create({
    data: {
      id: createId(),
      token: createId(),
      clientId,
      userId,
      referenceId: organizationId,
      scopes: ["openid"],
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      createdAt: now,
    },
  });
  return clientId;
}

const ids = ({ items }: { items: { id: string }[] }) => items.map((item) => item.id);

describe("cross-organization isolation: API keys and OAuth grants", () => {
  it("hides and protects one organization's API keys from another", async () => {
    const contextA = testContext();
    const id = await seedKey({ context: contextA });
    const a = await connect({ context: contextA });
    const b = await connect({ context: testContext() });
    expect((await call({ client: b, name: "apiKey_list" })).data.items).toEqual([]);
    const get = await call({ client: b, name: "apiKey_get", args: { id } });
    expect(get.data.code).toBe("NOT_FOUND");
    expect((await call({ client: a, name: "apiKey_get", args: { id } })).data.id).toBe(id);
    const revoke = await call({ client: b, name: "apiKey_revoke", args: { id } });
    expect(revoke.data.code).toBe("NOT_FOUND");
    expect(ids({ items: (await call({ client: a, name: "apiKey_list" })).data.items })).toEqual([
      id,
    ]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { apiKeys { items { id } } }" },
    });
    expect(graph.data.data).toEqual({ apiKeys: { items: [] } });
  });

  it("keeps a user's grant in organization A out of their organization B (#223)", async () => {
    const userId = `user_${createId()}`;
    const actor = { type: "user", userId } as const;
    const contextA = testContext({ actor });
    const clientId = await seedGrant({ userId, organizationId: contextA.organizationId });
    const a = await connect({ context: contextA });
    const b = await connect({ context: testContext({ actor }) });
    expect((await call({ client: b, name: "oauthGrant_list" })).data.items).toEqual([]);
    const revoke = await call({ client: b, name: "oauthGrant_revoke", args: { clientId } });
    expect(revoke.data.code).toBe("NOT_FOUND");
    expect(ids({ items: (await call({ client: a, name: "oauthGrant_list" })).data.items })).toEqual(
      [clientId],
    );
  });
});

describe("apiKey_create over MCP (#88, #90)", () => {
  it("is never offered to the AI actor and refused for OAuth-token callers", async () => {
    const userId = `user_${createId()}`;
    const ai = await connect({ context: testContext({ actor: { type: "ai", userId } }) });
    const names = (await ai.listTools()).tools.map((tool) => tool.name);
    expect(names).not.toContain("apiKey_create");
    expect(names).toContain("apiKey_list");
    const proposed = await call({
      client: ai,
      name: "apiKey_create",
      args: { name: "x", role: "member" },
    });
    expect(proposed.data.code).toBe("NOT_FOUND");
    const user = {
      ...testContext({ actor: { type: "user", userId } }),
      credential: "accessToken" as const,
    };
    const client = await connect({ context: user });
    const created = await call({
      client,
      name: "apiKey_create",
      args: { name: "x", role: "member" },
    });
    expect(created.data.code).toBe("FORBIDDEN");
    expect(await getDb().apikey.count({ where: { organizationId: user.organizationId } })).toBe(0);
  });

  it("cannot be run through approval_confirm even with a validly signed approval", async () => {
    const userId = `user_${createId()}`;
    const context = {
      ...testContext({ actor: { type: "user", userId } }),
      credential: "session" as const,
    };
    const { token } = signApprovalToken({
      operation: "apiKey.create",
      input: { name: "x", role: "member" },
      organizationId: context.organizationId,
      userId,
      secret: getEnv().BETTER_AUTH_SECRET,
    });
    const user = await connect({ context });
    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: token },
    });
    expect(confirmed.data.code).toBe("FORBIDDEN");
    expect(await getDb().apikey.count({ where: { organizationId: context.organizationId } })).toBe(
      0,
    );
  });
});
