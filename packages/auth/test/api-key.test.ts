import { createVenue, execute, getVenue } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { createOrgApiKey, getAuth, resolveExecuteContext } from "../src/index";
import { codeOf, createOrg, signUp } from "./helpers";
import { addMember, addRole, READ_ONLY, WRITER } from "./roles";

type Resolved = Awaited<ReturnType<typeof resolveExecuteContext>>;
const keyHeaders = ({ key }: { key: string }) => new Headers({ "x-api-key": key });

const ownerWithKey = async ({ role = "Skriv" }: { role?: string } = {}) => {
  const owner = await signUp();
  const organizationId = await createOrg({ headers: owner.headers });
  await addRole({ organizationId, name: "Skriv", permissions: WRITER });
  await addRole({ organizationId, name: "Read", permissions: READ_ONLY });
  const created = await createOrgApiKey({
    headers: owner.headers,
    organizationId,
    name: "ci",
    role,
  });
  if (!created.ok) throw created.error;
  return { owner, organizationId, key: created.value.key };
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
      expect(result.value.roles).toEqual(["Skriv"]);
      expect(result.value.permissions).toEqual({
        venue: ["read", "write"],
        item: ["read", "write"],
      });
      expect(result.value.actor).toEqual({ type: "user", userId: owner.userId });
    }
  });

  it("rejects unknown keys and the owner role", async () => {
    const result = await resolveExecuteContext({ headers: keyHeaders({ key: "okz_nope" }) });
    expect(codeOf({ result })).toBe("UNAUTHENTICATED");
    const { owner, organizationId } = await ownerWithKey();
    const asOwner = await createOrgApiKey({
      headers: owner.headers,
      organizationId,
      name: "x",
      role: "owner",
    });
    expect(codeOf({ result: asOwner })).toBe("FORBIDDEN");
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

  it("refuses keys for organizations the owner does not belong to", async () => {
    const { owner } = await ownerWithKey();
    const foreign = await ownerWithKey();
    const viaHelper = await createOrgApiKey({
      headers: owner.headers,
      organizationId: foreign.organizationId,
      name: "x",
      role: "Read",
    });
    expect(codeOf({ result: viaHelper })).toBe("FORBIDDEN");
    // Even a key forged with foreign metadata (bypassing the helper) is rejected at resolve time.
    const forged = await getAuth().api.createApiKey({
      body: {
        userId: owner.userId,
        name: "forged",
        metadata: { organizationId: foreign.organizationId, role: "Skriv" },
      },
    });
    const result = await resolveExecuteContext({ headers: keyHeaders({ key: forged.key }) });
    expect(codeOf({ result })).toBe("FORBIDDEN");
  });

  it("caps the key at the member's live access", async () => {
    const { owner, organizationId } = await ownerWithKey();
    const reader = await signUp();
    await addMember({ organizationId, userId: reader.userId, role: "Read" });
    const tooHigh = await createOrgApiKey({
      headers: reader.headers,
      organizationId,
      name: "v",
      role: "Skriv",
    });
    expect(codeOf({ result: tooHigh })).toBe("FORBIDDEN");
    const readerKey = await createOrgApiKey({
      headers: reader.headers,
      organizationId,
      name: "v",
      role: "Read",
    });
    if (!readerKey.ok) throw readerKey.error;
    const context = await resolveKey({ key: readerKey.value.key });
    const write = await execute({ operation: createVenue, input: { name: "no" }, context });
    expect(codeOf({ result: write })).toBe("FORBIDDEN");
    await getAuth().api.removeMember({
      headers: owner.headers,
      body: { memberIdOrEmail: reader.email, organizationId },
    });
    const after = await resolveExecuteContext({
      headers: keyHeaders({ key: readerKey.value.key }),
    });
    expect(codeOf({ result: after })).toBe("FORBIDDEN");
  });
});
