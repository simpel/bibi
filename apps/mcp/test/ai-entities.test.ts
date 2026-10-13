import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type SetupInput = { conversationId?: string };

async function setup({ conversationId = "conv_x" }: SetupInput = {}) {
  const userId = `user_${createId()}`;
  const base = testContext({ actor: { type: "user", userId } });
  const ai = testContext({
    organizationId: base.organizationId,
    actor: { type: "ai", userId, conversationId },
  });
  return { base, user: await connect({ context: base }), assistant: await connect({ context: ai }) };
}

const SKILL = { name: "MCP skill", description: "D", instructions: "I", allowedTools: ["search"] };

describe("conversation, message and skill tools", () => {
  it("lets the user manage conversations and messages directly", async () => {
    const { user } = await setup();
    const conversation = (await call({ client: user, name: "conversation_create", args: { title: "MCP" } })).data;
    expect(conversation).toMatchObject({ title: "MCP", status: "ACTIVE" });
    const parts = [{ type: "text", text: "Hej" }];
    const appended = await call({
      client: user,
      name: "message_append",
      args: { conversationId: conversation.id, role: "USER", parts },
    });
    expect(appended.data).toMatchObject({ sequence: 0, parts });
    const list = await call({ client: user, name: "message_list", args: { conversationId: conversation.id } });
    expect(list.data.items).toHaveLength(1);
    const exported = await call({ client: user, name: "skill_list", args: { scope: "SYSTEM" } });
    expect(exported.isError).toBe(false);
  });

  it("lets the assistant append its own messages without approval, but never user turns", async () => {
    const { base, user } = await setup();
    const conversation = (await call({ client: user, name: "conversation_create", args: {} })).data;
    const ai = testContext({
      organizationId: base.organizationId,
      actor: { type: "ai", userId: base.actor.userId, conversationId: conversation.id },
    });
    const assistant = await connect({ context: ai });
    const parts = [{ type: "text", text: "Svar" }];
    const ok = await call({
      client: assistant,
      name: "message_append",
      args: { conversationId: conversation.id, role: "ASSISTANT", parts },
    });
    expect(ok.data).toMatchObject({ role: "ASSISTANT", actorType: "AI", sequence: 0 });
    const forged = await call({
      client: assistant,
      name: "message_append",
      args: { conversationId: conversation.id, role: "USER", parts },
    });
    expect(forged.isError).toBe(true);
    expect(forged.data.code).toBe("FORBIDDEN");
  });

  it("only proposes AI skill commands; approval executes them with approvedBy", async () => {
    const { base, user, assistant } = await setup();
    const proposal = await call({ client: assistant, name: "skill_create", args: SKILL });
    expect(proposal.data).toMatchObject({
      status: "approval_required",
      operation: "skill.create",
      summary: 'Create personal skill "MCP skill"',
    });
    expect(await base.db.skill.count({ where: { scope: "PERSONAL" } })).toBe(0);
    expect(await base.db.auditLog.count()).toBe(0);
    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.data).toMatchObject({ name: "MCP skill", status: "DRAFT", scope: "PERSONAL" });
    const [row] = await base.db.auditLog.findMany();
    expect(row).toMatchObject({
      operation: "skill.create",
      actorType: "AI",
      actorId: base.actor.userId,
      approvedBy: base.actor.userId,
      conversationId: "conv_x",
    });
    const exported = await call({ client: assistant, name: "skill_export", args: { id: confirmed.data.id } });
    expect(exported.data.markdown).toContain("name: mcp-skill");
  });
});
