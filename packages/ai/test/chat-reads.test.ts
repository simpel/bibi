import { resolveExecuteContext } from "@okazi/auth";
import { createVenue } from "@okazi/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createEmbed } from "../src/embeddings/create-embed";
import { runCore } from "../src/server/run-core";
import { resolveUser } from "../src/server/resolve-user";
import { resolveToolUi } from "../src/ui-contract/resolve-tool-ui";
import { registerWebClient, signUpWithOrg, type TestUser } from "./helpers/auth";
import { chatRequest, createHarness, type Json, readChunks } from "./helpers/chat";
import { type RunningMcp, startMcpServer } from "./helpers/mcp-server";
import { mockModel, textStep, toolStep } from "./helpers/mock-model";

let mcp: RunningMcp;

beforeAll(async () => {
  await registerWebClient();
  mcp = await startMcpServer();
});
afterAll(() => mcp.close());

/** Creates a venue as the user through core (indexed for search by the placeholder embedder). */
async function seedVenue({ user, name }: { user: TestUser; name: string }) {
  const resolved = await resolveUser({ headers: user.cookies, resolveContext: resolveExecuteContext });
  if (!resolved.ok) throw resolved.error;
  const created = await runCore({ operation: createVenue, input: { name }, context: resolved.value, embed: createEmbed() });
  if (!created.ok) throw created.error;
}

type AskInput = { user: TestUser; toolName: string; input: Record<string, unknown> };

async function askWithTool({ user, toolName, input }: AskInput): Promise<Json[]> {
  const model = mockModel({ steps: [toolStep({ toolName, input }), textStep({ text: "Klart." })] });
  const { handler } = createHarness({ model, mcpUrl: mcp.url });
  return readChunks({ response: await handler(chatRequest({ cookies: user.cookies, text: "Visa" })) });
}

const toolOutput = ({ chunks }: { chunks: Json[] }) =>
  chunks.find((chunk) => chunk.type === "tool-output-available")?.output;

describe("read tools through the assistant", () => {
  it("venue_list returns the org's venues and maps to the venue-table component", async () => {
    const user = await signUpWithOrg();
    await seedVenue({ user, name: "Konferenshallen" });
    const output = toolOutput({ chunks: await askWithTool({ user, toolName: "venue_list", input: {} }) });
    expect(output.structuredContent.items.map((venue: Json) => venue.name)).toEqual(["Konferenshallen"]);
    const ui = resolveToolUi({ toolName: "venue_list", output });
    expect(ui.component).toBe("venue-table");
  });

  it("search finds a venue by text (hybrid search via MCP)", async () => {
    const user = await signUpWithOrg();
    await seedVenue({ user, name: "Volvohallen Göteborg" });
    const chunks = await askWithTool({ user, toolName: "search", input: { query: "Volvohallen" } });
    const output = toolOutput({ chunks });
    expect(output.structuredContent.hits[0]).toMatchObject({ entityType: "venue" });
    expect(resolveToolUi({ toolName: "search", output }).component).toBe("search-results");
  });

  it("keeps organizations apart: another org neither sees the venue nor the conversation", async () => {
    const owner = await signUpWithOrg();
    await seedVenue({ user: owner, name: "Hemlig sal" });
    const first = await createHarness({ model: mockModel({ steps: [textStep({ text: "ok" })] }), mcpUrl: mcp.url })
      .handler(chatRequest({ cookies: owner.cookies, text: "Hej" }));
    const conversationId = first.headers.get("x-okazi-conversation-id") ?? "";
    await readChunks({ response: first });

    const stranger = await signUpWithOrg();
    const output = toolOutput({ chunks: await askWithTool({ user: stranger, toolName: "venue_list", input: {} }) });
    expect(output.structuredContent.items).toEqual([]);
    const { handler, clients } = createHarness({ model: mockModel({ steps: [] }), mcpUrl: mcp.url });
    const hijack = await handler(chatRequest({ cookies: stranger.cookies, text: "Hej", conversationId }));
    expect(hijack.status).toBe(404);
    expect(clients.opened).toBe(0);
  });
});
