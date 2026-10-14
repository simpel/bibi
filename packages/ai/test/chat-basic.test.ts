import { getDb } from "@okazi/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerWebClient, signUpWithOrg } from "./helpers/auth";
import { chatRequest, createHarness, readChunks } from "./helpers/chat";
import { storedMessages, waitFor } from "./helpers/db";
import { type RunningMcp, startMcpServer } from "./helpers/mcp-server";
import { mockModel, offeredTools, textStep } from "./helpers/mock-model";

let mcp: RunningMcp;

beforeAll(async () => {
  await registerWebClient();
  mcp = await startMcpServer();
});
afterAll(() => mcp.close());

describe("createChatHandler – plain answers", () => {
  it("streams the answer, persists USER + ASSISTANT messages and closes the MCP client", async () => {
    const user = await signUpWithOrg();
    const model = mockModel({ steps: [textStep({ text: "Hi! How can I help?" })] });
    const { handler, clients } = createHarness({ model, mcpUrl: mcp.url });
    const response = await handler(chatRequest({ cookies: user.cookies, text: "Hej\nmer text" }));
    expect(response.status).toBe(200);
    const conversationId = response.headers.get("x-okazi-conversation-id") ?? "";
    expect(conversationId).not.toBe("");
    const chunks = await readChunks({ response });
    expect(chunks).toContainEqual(
      expect.objectContaining({
        type: "data-okazi-conversation",
        data: { conversationId, created: true },
      }),
    );
    expect(chunks).toContainEqual(
      expect.objectContaining({ type: "text-delta", delta: "Hi! How can I help?" }),
    );

    const rows = await storedMessages({ conversationId, minCount: 2 });
    expect(rows.map((row) => [row.role, row.actorType])).toEqual([
      ["USER", "USER"],
      ["ASSISTANT", "AI"],
    ]);
    expect(rows[1]?.parts).toContainEqual(
      expect.objectContaining({ type: "text", text: "Hi! How can I help?" }),
    );
    const conversation = await getDb().conversation.findUnique({ where: { id: conversationId } });
    expect(conversation).toMatchObject({
      title: "Hej",
      ownerUserId: user.userId,
      organizationId: user.organizationId,
    });
    const audit = await getDb().auditLog.findFirst({
      where: { operation: "message.append", conversationId },
    });
    expect(audit).toMatchObject({ actorType: "AI", actorId: user.userId });
    await waitFor({ check: () => clients.closed === clients.opened && clients.opened === 1 });
  });

  it("offers the MCP tools of the AI actor plus local skill tools, never approval_confirm", async () => {
    const user = await signUpWithOrg();
    const model = mockModel({ steps: [textStep({ text: "ok" })] });
    const { handler } = createHarness({ model, mcpUrl: mcp.url });
    await readChunks({
      response: await handler(chatRequest({ cookies: user.cookies, text: "Hej" })),
    });
    const tools = offeredTools({ model, call: 0 });
    expect(tools).toEqual(
      expect.arrayContaining([
        "venue_create",
        "search",
        "graphql_query",
        "skill_search",
        "load_skill",
      ]),
    );
    expect(tools).not.toContain("approval_confirm");
    expect(model.doStreamCalls[0]?.prompt[0]).toMatchObject({ role: "system" });
  });

  it("continues a conversation with the stored history", async () => {
    const user = await signUpWithOrg();
    const model = mockModel({
      steps: [textStep({ text: "First answer" }), textStep({ text: "Second" })],
    });
    const { handler } = createHarness({ model, mcpUrl: mcp.url });
    const first = await handler(chatRequest({ cookies: user.cookies, text: "Question one" }));
    const conversationId = first.headers.get("x-okazi-conversation-id") ?? "";
    await readChunks({ response: first });
    await storedMessages({ conversationId, minCount: 2 });
    const second = await handler(
      chatRequest({ cookies: user.cookies, text: "Question two", conversationId }),
    );
    await readChunks({ response: second });
    const prompt = JSON.stringify(model.doStreamCalls[1]?.prompt);
    expect(prompt).toContain("Question one");
    expect(prompt).toContain("First answer");
    expect((await storedMessages({ conversationId, minCount: 4 })).length).toBe(4);
  });

  it("answers 401 without a session and 400 for an invalid body", async () => {
    const { handler, clients } = createHarness({
      model: mockModel({ steps: [] }),
      mcpUrl: mcp.url,
    });
    const anonymous = await handler(chatRequest({ cookies: new Headers(), text: "Hej" }));
    expect(anonymous.status).toBe(401);
    expect((await anonymous.json()).error.code).toBe("UNAUTHENTICATED");
    const user = await signUpWithOrg();
    const headers = new Headers(user.cookies);
    const bad = await handler(
      new Request("http://localhost/chat", { method: "POST", headers, body: "{}" }),
    );
    expect(bad.status).toBe(400);
    expect(clients.opened).toBe(0);
  });
});
