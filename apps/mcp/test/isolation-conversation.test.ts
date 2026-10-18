import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const PARTS = [{ type: "text", text: "Secret question" }];

type SeedInput = { client: Awaited<ReturnType<typeof connect>> };

async function seed({ client }: SeedInput) {
  const conversation = await call({
    client,
    name: "conversation_create",
    args: { title: "Secret plans" },
  });
  expect(conversation.isError, JSON.stringify(conversation.data)).toBe(false);
  const message = await call({
    client,
    name: "message_append",
    args: { conversationId: conversation.data.id, role: "USER", parts: PARTS },
  });
  expect(message.isError, JSON.stringify(message.data)).toBe(false);
  return { id: conversation.data.id as string };
}

type AccessInput = { reader: SeedInput["client"]; owner: SeedInput["client"]; id: string };

async function expectHidden({ reader, owner, id }: AccessInput) {
  const checks = [
    ["conversation_get", { id }],
    ["conversation_rename", { id, title: "Hacked" }],
    ["conversation_archive", { id }],
    ["message_list", { conversationId: id }],
    ["message_append", { conversationId: id, role: "USER", parts: PARTS }],
  ] as const;
  for (const [name, args] of checks) {
    const result = await call({ client: reader, name, args });
    expect(result.data.code, name).toBe("NOT_FOUND");
  }
  const listed = await call({ client: reader, name: "conversation_list" });
  expect(listed.data.items.map((item: { id: string }) => item.id)).not.toContain(id);
  const own = await call({ client: owner, name: "conversation_get", args: { id } });
  expect(own.data.title).toBe("Secret plans");
  expect(own.data.status).toBe("ACTIVE");
  const messages = await call({
    client: owner,
    name: "message_list",
    args: { conversationId: id },
  });
  expect(messages.data.items).toHaveLength(1);
}

describe("cross-organization isolation: conversations and messages", () => {
  it("hides one organization's conversations and messages from another", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { id } = await seed({ client: a });
    await expectHidden({ reader: b, owner: a, id });
    const all = await call({ client: b, name: "conversation_list", args: { allUsers: true } });
    expect(all.data.items.map((item: { id: string }) => item.id)).not.toContain(id);
    const created = await call({ client: b, name: "conversation_create", args: {} });
    expect(created.data.id).not.toBe(id);
  });

  it("keeps a conversation private to its owner within the same organization", async () => {
    const organizationId = `org_${createId()}`;
    const owner = await connect({ context: testContext({ organizationId, access: "write" }) });
    const colleague = await connect({ context: testContext({ organizationId, access: "write" }) });
    const { id } = await seed({ client: owner });
    await expectHidden({ reader: colleague, owner, id });
  });
});
