import { runWithLogContext } from "@okazi/logger";
import { describe, expect, it } from "vitest";
import { mcpHeaders } from "../src/mcp/connect-mcp";

describe("mcpHeaders", () => {
  it("forwards the chat request id to MCP so the AI run is one trace (ADR 0014)", () => {
    const caller = { kind: "ai" as const, conversationId: "conv_1" };
    const inside = runWithLogContext({
      context: { requestId: "chat-req-0001", surface: "ai" },
      fn: () => mcpHeaders({ accessToken: "t", caller }),
    });
    expect(inside["x-request-id"]).toBe("chat-req-0001");
    expect(mcpHeaders({ accessToken: "t", caller })["x-request-id"]).toBeUndefined();
  });
});
