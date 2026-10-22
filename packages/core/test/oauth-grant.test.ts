import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { execute, listOauthGrants, revokeOauthGrant } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A user with a live refresh token for a fresh client in `organizationId` (as Better Auth). */
const connect = async ({ organizationId, userId }: { organizationId: string; userId?: string }) => {
  const db = getDb();
  const user = userId ?? `user_${createId()}`;
  if (!userId) {
    await db.user.create({ data: { id: user, name: "U", email: `${user}@example.test` } });
  }
  const clientId = `client_${createId()}`;
  const now = new Date();
  await db.oauthClient.create({
    data: { id: createId(), clientId, name: "Claude Desktop", createdAt: now, updatedAt: now },
  });
  await db.oauthRefreshToken.create({
    data: {
      id: createId(),
      token: createId(),
      clientId,
      userId: user,
      referenceId: organizationId,
      scopes: ["openid", "offline_access"],
      expiresAt: new Date(now.getTime() + DAY_MS),
      createdAt: now,
    },
  });
  return { userId: user, clientId };
};

describe("oauthGrant operations (ADR 0005)", () => {
  it("lists the caller's own grants in this organization only", async () => {
    const organizationId = `org_${createId()}`;
    const mine = await connect({ organizationId });
    await connect({ organizationId });
    await connect({ organizationId: `org_${createId()}`, userId: mine.userId });
    const context = testContext({ organizationId, actor: { type: "user", userId: mine.userId } });
    const list = unwrap({
      result: await execute({ operation: listOauthGrants, input: {}, context }),
    });
    expect(list.items).toEqual([
      expect.objectContaining({
        clientId: mine.clientId,
        name: "Claude Desktop",
        scopes: ["offline_access", "openid"],
      }),
    ]);
  });

  it("revokes tokens, records the revocation and audits it", async () => {
    const organizationId = `org_${createId()}`;
    const { userId, clientId } = await connect({ organizationId });
    const context = testContext({ organizationId, actor: { type: "user", userId } });
    const result = await execute({ operation: revokeOauthGrant, input: { clientId }, context });
    expect(unwrap({ result }).clientId).toBe(clientId);
    const tokens = await getDb().oauthRefreshToken.findMany({ where: { clientId } });
    expect(tokens.every((token) => token.revoked !== null)).toBe(true);
    const marker = await context.db.oauthGrantRevocation.findFirst({ where: { clientId } });
    expect(marker?.userId).toBe(userId);
    const list = unwrap({
      result: await execute({ operation: listOauthGrants, input: {}, context }),
    });
    expect(list.items).toEqual([]);
    const audit = await context.db.auditLog.findFirst({
      where: { operation: "oauthGrant.revoke" },
    });
    expect(audit?.entityId).toBe(clientId);
    const again = await execute({ operation: revokeOauthGrant, input: { clientId }, context });
    expect(errorCode({ result: again })).toBe("NOT_FOUND");
  });

  it("cannot revoke another user's grant", async () => {
    const organizationId = `org_${createId()}`;
    const { clientId } = await connect({ organizationId });
    const context = testContext({ organizationId });
    const result = await execute({ operation: revokeOauthGrant, input: { clientId }, context });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    const tokens = await getDb().oauthRefreshToken.findMany({ where: { clientId } });
    expect(tokens.map((token) => token.revoked)).toEqual([null]);
  });
});
