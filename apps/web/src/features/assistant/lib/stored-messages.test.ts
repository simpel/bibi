import type { MessageDto } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { toStoredConversation } from "./stored-messages";

const base = {
  organizationId: "o",
  conversationId: "c",
  metadata: {},
  actorType: "USER" as const,
  createdAt: new Date(0),
  createdBy: null,
};

type MessageInput = Partial<MessageDto> & Pick<MessageDto, "id" | "role" | "parts">;

const message = ({ ...input }: MessageInput) => ({ ...base, sequence: 0, ...input }) as MessageDto;

describe("toStoredConversation", () => {
  it("keeps user text and assistant parts, drops system and tool notes from the chat", () => {
    const result = toStoredConversation({
      messages: [
        message({ id: "1", role: "USER", parts: [{ type: "text", text: "Hej" }] }),
        message({ id: "2", role: "ASSISTANT", parts: [{ type: "text", text: "Hello there" }] }),
        message({ id: "3", role: "SYSTEM", parts: [{ type: "text", text: "x" }] }),
      ],
    });
    expect(result.messages.map(({ id, role }) => [id, role])).toEqual([
      ["1", "user"],
      ["2", "assistant"],
    ]);
    expect(result.decisions).toEqual([]);
  });

  it("reads approval decisions and the parsed result from TOOL notes", () => {
    const parts = [
      {
        type: "text",
        text: 'Approval update: the user APPROVED venue.create. Result: {"id":"v1"}',
      },
      {
        type: "data-okazi-approval",
        data: { toolCallId: "call_1", operation: "venue.create", decision: "approved" },
      },
    ];
    const result = toStoredConversation({ messages: [message({ id: "t", role: "TOOL", parts })] });
    expect(result.decisions).toEqual([
      { toolCallId: "call_1", decision: "approved", result: { id: "v1" } },
    ]);
  });

  it("ignores notes without a tool call id", () => {
    const parts = [
      { type: "data-okazi-approval", data: { toolCallId: null, decision: "rejected" } },
    ];
    const result = toStoredConversation({ messages: [message({ id: "t", role: "TOOL", parts })] });
    expect(result.decisions).toEqual([]);
  });
});
