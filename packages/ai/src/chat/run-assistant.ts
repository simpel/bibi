import type { MCPClient } from "@ai-sdk/mcp";
import type { UIMessage } from "ai";
import { buildSystemPrompt } from "../prompt/build-system-prompt";
import { errorResponse } from "../server/error-response";
import type { UserContext } from "../server/resolve-user";
import type { ChatRuntime } from "./handle-chat";
import { loadPromptFormats } from "./load-prompt-formats";
import { onRunFinish } from "./on-run-finish";
import type { ChatInput } from "./parse-chat-input";
import { persistUserMessage } from "./persist-user-message";
import { type PreparedTools, prepareTools } from "./prepare-tools";
import { streamChat } from "./stream-chat";
import { streamFailure } from "./stream-failure";
import { toModelMessages } from "./to-model-messages";

export type RunAssistantInput = {
  runtime: ChatRuntime;
  headers: Headers;
  user: UserContext;
  input: ChatInput;
  conversation: { id: string; created: boolean };
  history: UIMessage[];
};

type StreamRunInput = RunAssistantInput & { client: MCPClient };

type ModelInputArgs = Pick<RunAssistantInput, "user" | "input" | "history"> & {
  prepared: PreparedTools;
  storedMessageId: string;
};

/** Model messages (history + the new user turn) and system instructions for this run. */
async function buildModelInput({
  user,
  input,
  history,
  prepared,
  storedMessageId,
}: ModelInputArgs) {
  const { text, page, locale } = input;
  const userMessage: UIMessage = {
    id: storedMessageId,
    role: "user",
    parts: [{ type: "text", text }],
  };
  const messages = await toModelMessages({
    messages: [...history, userMessage],
    tools: prepared.tools,
  });
  const formats = await loadPromptFormats({ user, locale });
  const instructions = buildSystemPrompt({
    organizationId: user.organizationId,
    locale,
    formats,
    skills: prepared.promptSkills,
    access: { roles: user.roles, permissions: user.permissions },
    ...(page ? { page } : {}),
  });
  return { messages, instructions };
}

async function streamRun({ runtime, user, input, conversation, history, client }: StreamRunInput) {
  const conversationId = conversation.id;
  const prepared = await prepareTools({ client, userText: input.text });
  const stored = await persistUserMessage({
    user,
    embed: runtime.embed,
    conversationId,
    text: input.text,
    clientMessageId: input.clientMessageId,
    ...(input.page ? { page: input.page } : {}),
  });
  if (!stored.ok) return stored;
  const storedMessageId = stored.value.id;
  const { messages, instructions } = await buildModelInput({
    user,
    input,
    history,
    prepared,
    storedMessageId,
  });
  const response = streamChat({
    model: runtime.model,
    instructions,
    messages,
    prepared,
    conversation,
    onError: streamFailure({ modelId: runtime.modelId }),
    onFinish: onRunFinish({ runtime, client, conversationId }),
  });
  return { ok: true as const, value: response };
}

/**
 * Mints the user's MCP token, connects as the AI actor for this conversation and streams the run.
 * The MCP client is closed by `finishRun` when the stream ends, or here on any earlier failure.
 */
export async function runAssistant({
  runtime,
  headers,
  user,
  input,
  conversation,
  history,
}: RunAssistantInput): Promise<Response> {
  const caller = { userId: user.actor.userId, organizationId: user.organizationId };
  const token = await runtime.getAccessToken({ headers, caller });
  if (!token.ok) return errorResponse({ error: token.error });
  const client = await runtime.connect({
    accessToken: token.value,
    caller: { kind: "ai", conversationId: conversation.id },
    ...(runtime.mcpUrl ? { url: runtime.mcpUrl } : {}),
  });
  try {
    const result = await streamRun({
      runtime,
      headers,
      user,
      input,
      conversation,
      history,
      client,
    });
    if (result.ok) return result.value;
    await client.close();
    return errorResponse({ error: result.error });
  } catch (error) {
    await client.close().catch(() => undefined);
    throw error;
  }
}
