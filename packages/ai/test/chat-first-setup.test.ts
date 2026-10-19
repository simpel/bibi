import { draftFromPreset } from "@okazi/core/pipeline-setup-templates";
import { seedSystemSkills } from "@okazi/core/seed";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerWebClient, signUpWithOrg, type TestUser } from "./helpers/auth";
import {
  type ChatHarness,
  chatRequest,
  createHarness,
  type Json,
  readChunks,
} from "./helpers/chat";
import { type RunningMcp, startMcpServer } from "./helpers/mcp-server";
import { mockModel, textStep, toolStep } from "./helpers/mock-model";

let mcp: RunningMcp;

beforeAll(async () => {
  await registerWebClient();
  await seedSystemSkills();
  mcp = await startMcpServer();
});
afterAll(() => mcp.close());

type AskInput = { id: string; text: string; values: string[] };

/** A model step that asks one question with these answers. */
const ask = ({ id, text, values }: AskInput) =>
  toolStep({
    toolName: "ask_question",
    input: { question: text, choices: values.map((value) => ({ value, label: value })) },
    id,
  });

type TurnInput = { harness: ChatHarness; user: TestUser; text: string; conversationId?: string };

/** One chat turn on `/sv/onboarding`; returns the stream chunks and the conversation id. */
async function turn({ harness, user, text, conversationId }: TurnInput) {
  const route = "/sv/onboarding";
  const request = chatRequest({
    cookies: user.cookies,
    text,
    route,
    ...(conversationId ? { conversationId } : {}),
  });
  const response = await harness.handler(request);
  const id = response.headers.get("x-okazi-conversation-id") ?? "";
  return { chunks: await readChunks({ response }), conversationId: id };
}

const outputOf = ({ chunks, id }: { chunks: Json[]; id: string }) =>
  chunks.find((chunk) => chunk.type === "tool-output-available" && chunk.toolCallId === id)?.output;

describe("first setup (ADR 0045)", () => {
  it("three answered questions lead to a draft the preview reports as ready", async () => {
    const user = await signUpWithOrg();
    const draft = draftFromPreset({ key: "conference-estate", existingTypes: [] });
    const model = mockModel({
      steps: [
        toolStep({ toolName: "load_skill", input: { slug: "first-setup" } }),
        ask({ id: "q1", text: "What kind of place?", values: ["conference-estate", "other"] }),
        ask({ id: "q2", text: "What do you sell?", values: ["rooms", "food", "both"] }),
        ask({ id: "q3", text: "A quote first?", values: ["quote-first", "book-directly"] }),
        toolStep({ toolName: "pipelineSetup_presetDraft", input: { key: "conference-estate" } }),
        toolStep({ toolName: "pipelineSetup_preview", input: draft }),
        textStep({ text: "Here is a first version. Nothing is saved yet." }),
      ],
    });
    const harness = createHarness({ model, mcpUrl: mcp.url });

    const first = await turn({ harness, user, text: "Let's get started" });
    const system = JSON.stringify(model.doStreamCalls[0]?.prompt[0]);
    expect(system).toContain('load_skill({ slug: \\"first-setup\\" })');
    expect(outputOf({ chunks: first.chunks, id: "call_load_skill" })).toMatchObject({
      slug: "first-setup",
    });
    // A question ends the turn: the model is not called again until the user answers.
    expect(outputOf({ chunks: first.chunks, id: "q1" })).toMatchObject({ status: "asked" });
    expect(model.doStreamCalls).toHaveLength(2);

    const { conversationId } = first;
    await turn({ harness, user, text: "conference-estate", conversationId });
    await turn({ harness, user, text: "both", conversationId });
    expect(model.doStreamCalls).toHaveLength(4);
    const last = await turn({ harness, user, text: "quote-first", conversationId });

    const preset = outputOf({ chunks: last.chunks, id: "call_pipelineSetup_presetDraft" });
    expect(preset.structuredContent).toEqual(JSON.parse(JSON.stringify(draft)));
    const preview = outputOf({ chunks: last.chunks, id: "call_pipelineSetup_preview" });
    expect(preview.structuredContent.ready).toBe(true);
    expect(model.doStreamCalls).toHaveLength(7);
  });
});
