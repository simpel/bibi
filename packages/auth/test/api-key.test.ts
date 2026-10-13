import { createExecuteContext, createVenue, execute, getVenue } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { createOrgApiKey, getAuth, resolveExecuteContext } from "../src/index";
import { createOrg, signUp } from "./helpers";

type Resolved = Awaited<ReturnType<typeof resolveExecuteContext>>;
const codeOf = (result: { ok: boolean; error?: { code: string } }) =>
  result.ok ? "OK" : result.error?.code;
const keyHeaders = ({ key }: { key: string }) => new Headers({ "x-api-key": key });

const ownerWithKey = async ({ role }: { role: "viewer" | "member" | "admin" }) => {
  const owner = await signUp();
  const organizationId = await createOrg({ headers: owner.headers });
  const created = await createOrgApiKey({ headers: owner.headers, organizationId, name: "ci", role });
  if (!created.ok) throw created.error;
  return { owner, organizationId, key: created.value.key };
};

describe("resolveExecuteContext – API keys", () => {
  it("resolves org, owner and key role from x-api-key and Bearer okz_", async () => {
    const { owner, organizationId, key } = await ownerWithKey({ role: "member" });
    expect(key.startsWith("okz_")).toBe(true);
    const viaHeader = await resolveExecuteContext({ headers: keyHeaders({ key }) });
    const viaBearer = await resolveExecuteContext({
      headers: new Headers({ authorization: `Bearer ${key}` }),
    });
    for (const result of [viaHeader, viaBearer] as Resolved[]) {
      if (!result.ok) throw result.error;
      expect(result.value.organizationId).toBe(organizationId);
      expect(result.value.roles).toEqual(["member"]);
      expect(result.value.actor).toEqual({ type: "user", userId: owner.userId });
    }
  });

  it("rejects unknown keys", async () => {
    const result = await resolveExecuteContext({ headers: keyHeaders({ key: "okz_nope" }) });
    expect(codeOf(result)).toBe("UNAUTHENTICATED");
  });

  it("cannot read another organization's data", async () => {
    const { key } = await ownerWithKey({ role: "admin" });
    const other = await ownerWithKey({ role: "admin" });
    const otherContext = createExecuteContext({
      organizationId: other.organizationId,
      roles: ["owner"],
      actor: { type: "user", userId: other.owner.userId },
    });
    const venue = await execute({ operation: createVenue, input: { name: "B" }, context: otherContext });
    if (!venue.ok) throw venue.error;
    const context = await resolveExecuteContext({ headers: keyHeaders({ key }) });
    if (!context.ok) throw context.error;
    const read = await execute({ operation: getVenue, input: { id: venue.value.id }, context });
    expect(codeOf(read)).toBe("NOT_FOUND");
  });

  it("refuses keys for organizations the owner does not belong to", async () => {
    const { owner } = await ownerWithKey({ role: "viewer" });
    const foreign = await ownerWithKey({ role: "viewer" });
    const viaHelper = await createOrgApiKey({
      headers: owner.headers,
      organizationId: foreign.organizationId,
      name: "x",
    });
    expect(codeOf(viaHelper)).toBe("FORBIDDEN");
    // Even a key forged with foreign metadata (bypassing the helper) is rejected at resolve time.
    const forged = await getAuth().api.createApiKey({
      body: { userId: owner.userId, name: "forged", metadata: { organizationId: foreign.organizationId } },
    });
    const result = await resolveExecuteContext({ headers: keyHeaders({ key: forged.key }) });
    expect(codeOf(result)).toBe("FORBIDDEN");
  });

  it("caps key role at the owner's role and follows membership changes", async () => {
    const { organizationId, key } = await ownerWithKey({ role: "admin" });
    const viewer = await signUp();
    await getAuth().api.addMember({ body: { userId: viewer.userId, organizationId, role: "viewer" } });
    await getAuth().api.setActiveOrganization({ headers: viewer.headers, body: { organizationId } });
    const tooHigh = await createOrgApiKey({ headers: viewer.headers, organizationId, name: "v", role: "member" });
    expect(codeOf(tooHigh)).toBe("FORBIDDEN");
    const viewerKey = await createOrgApiKey({ headers: viewer.headers, organizationId, name: "v" });
    if (!viewerKey.ok) throw viewerKey.error;
    const resolved = await resolveExecuteContext({ headers: keyHeaders({ key: viewerKey.value.key }) });
    expect(resolved.ok && resolved.value.roles).toEqual(["viewer"]);
    const write = await execute({
      operation: createVenue,
      input: { name: "nope" },
      context: resolved.ok ? resolved.value : (undefined as never),
    });
    expect(codeOf(write)).toBe("FORBIDDEN");
    await getAuth().api.removeMember({ body: { memberIdOrEmail: viewer.email, organizationId } });
    const after = await resolveExecuteContext({ headers: keyHeaders({ key: viewerKey.value.key }) });
    expect(codeOf(after)).toBe("FORBIDDEN");
    expect((await resolveExecuteContext({ headers: keyHeaders({ key }) })).ok).toBe(true);
  });
});
