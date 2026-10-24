import { createRestHandler } from "@bibi/api";
import { getAuth, resolveExecuteContext } from "@bibi/auth";
import { createApiKey, createCoreOperations, execute, revokeApiKey } from "@bibi/core";
import { FALLBACK_TIME_ZONE } from "@bibi/core/schemas";
import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { fakeEmbed } from "./fake-embed";

/** The REST handler exactly as `apps/web` mounts it: the real caller resolution (#89). */
const handler = createRestHandler({
  operations: createCoreOperations({ embed: fakeEmbed }),
  resolveContext: resolveExecuteContext,
  embed: fakeEmbed,
});

const get = async ({ key }: { key: string }) =>
  (
    await handler(
      new Request("http://localhost:3330/api/v1/venues", { headers: { "x-api-key": key } }),
    )
  ).status;

/** An owner's new organization, their session context and one fresh admin key in it. */
async function ownerWithKey() {
  const email = `rest-${createId()}@example.test`;
  const auth = getAuth();
  const { headers } = await auth.api.signUpEmail({
    body: { email, password: "correct-horse-battery", name: "Rest Owner" },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const session = new Headers({ cookie });
  const slug = `org-${createId()}`;
  await auth.api.createOrganization({
    headers: session,
    body: { name: slug, slug, metadata: { timeZone: FALLBACK_TIME_ZONE } },
  });
  const context = await resolveExecuteContext({ headers: session });
  if (!context.ok) throw context.error;
  const input = { name: "REST", role: "admin" };
  const created = await execute({ operation: createApiKey, input, context: context.value });
  if (!created.ok) throw created.error;
  return { context: context.value, key: created.value.secret, id: created.value.apiKey.id };
}

describe("REST /api/v1 with API keys (#89)", () => {
  it("answers 200 for a live key and 401 as soon as it is revoked", async () => {
    const { context, key, id } = await ownerWithKey();
    expect(await get({ key })).toBe(200);
    const revoked = await execute({ operation: revokeApiKey, input: { id }, context });
    expect(revoked.ok).toBe(true);
    expect(await get({ key })).toBe(401);
  });

  it("answers 401 for an expired key", async () => {
    const { key, id } = await ownerWithKey();
    expect(await get({ key })).toBe(200);
    await getDb().apikey.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await get({ key })).toBe(401);
  });
});
