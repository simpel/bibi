import { createApiKey, execute } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedOrgMember } from "./seed-org-member";

const overrides = [{ feature: "item", action: "write", effect: "allow" }];

describe("cross-organization isolation: permissions and API key updates", () => {
  it("keeps one organization's member permissions from another", async () => {
    const contextA = testContext();
    const member = await seedOrgMember({ context: contextA });
    const subject = { subjectType: "member", subjectId: member.id };
    const a = await connect({ context: contextA });
    const b = await connect({ context: testContext() });
    const read = await call({ client: b, name: "permission_get", args: subject });
    expect(read.data.code).toBe("NOT_FOUND");
    const write = await call({
      client: b,
      name: "permission_update",
      args: { ...subject, overrides },
    });
    expect(write.data.code).toBe("NOT_FOUND");
    const own = await call({ client: a, name: "permission_get", args: subject });
    expect(own.data.overrides).toEqual([]);
  });

  it("keeps one organization's API keys from being changed by another", async () => {
    const contextA = testContext();
    const created = await execute({
      operation: createApiKey,
      input: { name: "Isolated", role: "member" },
      context: { ...contextA, credential: "session" },
    });
    if (!created.ok) throw created.error;
    const subject = { subjectType: "apiKey", subjectId: created.value.apiKey.id };
    const b = await connect({ context: testContext() });
    const rename = await call({
      client: b,
      name: "apiKey_update",
      args: { id: subject.subjectId, name: "Taken over" },
    });
    expect(rename.data.code).toBe("NOT_FOUND");
    const read = await call({ client: b, name: "permission_get", args: subject });
    expect(read.data.code).toBe("NOT_FOUND");
    const write = await call({
      client: b,
      name: "permission_update",
      args: { ...subject, overrides },
    });
    expect(write.data.code).toBe("NOT_FOUND");
  });
});
