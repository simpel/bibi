import { describe, expect, it } from "vitest";
import { readConversationId } from "./conversation-part";

describe("readConversationId", () => {
  it("reads the id of the conversation data part", () => {
    const part = { type: "data-bibi-conversation", data: { conversationId: "c1", created: true } };
    expect(readConversationId({ part })).toBe("c1");
  });

  it("ignores other parts", () => {
    expect(readConversationId({ part: { type: "data-other", data: {} } })).toBeNull();
    expect(readConversationId({ part: null })).toBeNull();
  });
});
