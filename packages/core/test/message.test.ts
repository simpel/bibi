import { describe, expect, it } from "vitest";
import {
  appendMessage,
  createConversation,
  type ExecuteContext,
  execute,
  listMessages,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";

type StartInput = { context: ExecuteContext };

async function start({ context }: StartInput) {
  return unwrap({ result: await execute({ operation: createConversation, input: {}, context }) });
}

const text = ({ value }: { value: string }) => [{ type: "text", text: value }];

describe("message operations", () => {
  it("appends messages in order with AI SDK parts and paginates them", async () => {
    const context = testContext({ roles: ["member"] });
    const conversation = await start({ context });
    const toolPart = {
      type: "tool-venue_list",
      toolCallId: "call_1",
      state: "output-available",
      input: {},
      output: { items: [] },
    };
    const inputs = [
      { role: "USER", parts: text({ value: "Hej" }) },
      { role: "ASSISTANT", parts: [{ type: "step-start" }, toolPart, ...text({ value: "Inga" })] },
      { role: "USER", parts: text({ value: "Tack" }), metadata: { clientMessageId: "m3" } },
    ];
    for (const input of inputs) {
      const result = await execute({
        operation: appendMessage,
        input: { conversationId: conversation.id, ...input },
        context,
      });
      expect(errorCode({ result })).toBeNull();
    }
    const first = unwrap({
      result: await execute({
        operation: listMessages,
        input: { conversationId: conversation.id, limit: 2 },
        context,
      }),
    });
    expect(first.items.map((m) => [m.sequence, m.role, m.actorType])).toEqual([
      [0, "USER", "USER"],
      [1, "ASSISTANT", "USER"],
    ]);
    expect(first.items[1]?.parts[1]).toEqual(toolPart);
    const second = unwrap({
      result: await execute({
        operation: listMessages,
        input: { conversationId: conversation.id, cursor: first.nextCursor ?? "" },
        context,
      }),
    });
    expect(second.items.map((m) => m.metadata)).toEqual([{ clientMessageId: "m3" }]);
    expect(second.nextCursor).toBeNull();
  });

  it("lets the assistant append only ASSISTANT/TOOL messages to its own conversation", async () => {
    const user = testContext({ roles: ["member"] });
    const conversation = await start({ context: user });
    const otherConversation = await start({ context: user });
    const ai = testContext({
      organizationId: user.organizationId,
      roles: ["member"],
      actor: { type: "ai", userId: user.actor.userId, conversationId: conversation.id },
    });
    type AppendInput = { role: string; conversationId?: string };
    const append = ({ role, conversationId = conversation.id }: AppendInput) =>
      execute({
        operation: appendMessage,
        input: { conversationId, role, parts: text({ value: "x" }) },
        context: ai,
      });
    expect(errorCode({ result: await append({ role: "ASSISTANT" }) })).toBeNull();
    expect(errorCode({ result: await append({ role: "TOOL" }) })).toBeNull();
    expect(errorCode({ result: await append({ role: "USER" }) })).toBe("FORBIDDEN");
    expect(errorCode({ result: await append({ role: "SYSTEM" }) })).toBe("FORBIDDEN");
    expect(
      errorCode({
        result: await append({ role: "ASSISTANT", conversationId: otherConversation.id }),
      }),
    ).toBe("FORBIDDEN");
    const rows = await user.db.message.findMany({ where: { conversationId: conversation.id } });
    expect(rows.map((row) => row.actorType)).toEqual(["AI", "AI"]);
    expect(appendMessage.approval).toBe(false);
  });

  it("hides messages from other users and organizations; admins may read", async () => {
    const owner = testContext({ roles: ["member"] });
    const conversation = await start({ context: owner });
    const input = {
      conversationId: conversation.id,
      role: "USER",
      parts: text({ value: "Hemligt" }),
    };
    await execute({ operation: appendMessage, input, context: owner });
    const list = ({ context }: { context: ExecuteContext }) =>
      execute({ operation: listMessages, input: { conversationId: conversation.id }, context });
    expect(errorCode({ result: await list({ context: peer({ of: owner }) }) })).toBe("NOT_FOUND");
    expect(errorCode({ result: await list({ context: testContext() }) })).toBe("NOT_FOUND");
    expect(
      errorCode({ result: await list({ context: peer({ of: owner, roles: ["admin"] }) }) }),
    ).toBeNull();
    const asAdmin = await execute({
      operation: appendMessage,
      input,
      context: peer({ of: owner, roles: ["admin"] }),
    });
    expect(errorCode({ result: asAdmin })).toBe("NOT_FOUND");
  });

  it("validates parts", async () => {
    const context = testContext();
    const conversation = await start({ context });
    const bad = [[], [{ text: "no type" }], [{ type: "text", text: 42 }]];
    for (const parts of bad) {
      const result = await execute({
        operation: appendMessage,
        input: { conversationId: conversation.id, role: "USER", parts },
        context,
      });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
  });
});
