import { resolveExecuteContext } from "@okazi/auth";
import { createSkill, publishSkill } from "@okazi/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createEmbed } from "../src/embeddings/create-embed";
import { resolveUser } from "../src/server/resolve-user";
import { runCore } from "../src/server/run-core";
import { registerWebClient, signUpWithOrg, type TestUser } from "./helpers/auth";
import { chatRequest, createHarness, readChunks } from "./helpers/chat";
import { type RunningMcp, startMcpServer } from "./helpers/mcp-server";
import { mockModel, offeredTools, textStep, toolStep } from "./helpers/mock-model";

let mcp: RunningMcp;

beforeAll(async () => {
  await registerWebClient();
  mcp = await startMcpServer();
});
afterAll(() => mcp.close());

/** A PUBLISHED personal skill that only allows `venue_list` (+ a tool the user lacks). */
async function seedSkill({ user, slug }: { user: TestUser; slug: string }) {
  const resolved = await resolveUser({
    headers: user.cookies,
    resolveContext: resolveExecuteContext,
  });
  if (!resolved.ok) throw resolved.error;
  const embed = createEmbed();
  const input = {
    slug,
    name: "List venues",
    description: "Use to list the venues of the organization",
    instructions: "1. Call venue_list.\n2. Summarize.",
    allowedTools: ["venue_list", "not_a_real_tool"],
  };
  const created = await runCore({ operation: createSkill, input, context: resolved.value, embed });
  if (!created.ok) throw created.error;
  const published = await runCore({
    operation: publishSkill,
    input: { id: created.value.id },
    context: resolved.value,
    embed,
  });
  if (!published.ok) throw published.error;
}

describe("skills in the assistant", () => {
  it("lists published skills in the prompt and load_skill narrows the tools for the rest of the run", async () => {
    const user = await signUpWithOrg();
    await seedSkill({ user, slug: "list-venues" });
    const model = mockModel({
      steps: [
        toolStep({ toolName: "load_skill", input: { slug: "list-venues" } }),
        toolStep({ toolName: "venue_create", input: { name: "Smugglad" }, id: "call_forbidden" }),
        textStep({ text: "Klart." }),
      ],
    });
    const { handler } = createHarness({ model, mcpUrl: mcp.url });
    const chunks = await readChunks({
      response: await handler(chatRequest({ cookies: user.cookies, text: "List" })),
    });

    expect(JSON.stringify(model.doStreamCalls[0]?.prompt[0])).toContain("list-venues");
    expect(JSON.stringify(model.doStreamCalls[0]?.prompt[0])).not.toContain("Call venue_list.");
    const loaded = chunks.find(
      (chunk) => chunk.type === "tool-output-available" && chunk.toolCallId === "call_load_skill",
    );
    expect(loaded?.output).toMatchObject({
      slug: "list-venues",
      instructions: expect.stringContaining("venue_list"),
    });
    expect(loaded?.output.activeTools.sort()).toEqual([
      "ask_question",
      "load_skill",
      "skill_search",
      "venue_list",
    ]);

    expect(offeredTools({ model, call: 0 })).toContain("venue_create");
    expect(offeredTools({ model, call: 1 })).toEqual([
      "ask_question",
      "load_skill",
      "skill_search",
      "venue_list",
    ]);
    // Outside the restriction the SDK refuses the call (not executed, no proposal).
    const forbidden = chunks.filter((chunk) => chunk.toolCallId === "call_forbidden");
    expect(forbidden.map((chunk) => chunk.type)).toContain("tool-output-error");
    expect(JSON.stringify(forbidden)).not.toContain("approval_required");
  });
});
