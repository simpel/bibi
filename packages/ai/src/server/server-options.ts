import type { EmbedFn } from "@okazi/core";
import { type GetAccessToken, getAssistantAccessToken } from "@okazi/auth";
import { createEmbed } from "../embeddings/create-embed";
import type { ResolveContext } from "./resolve-user";

/** Dependencies shared by the chat and approval handlers (all injectable for tests). */
export type AssistantServerOptions = {
  /** Resolves the caller from request headers: `resolveExecuteContext` from `@okazi/auth`. */
  resolveContext: ResolveContext;
  /** MCP token for the user; default `getAssistantAccessToken` (first-party OAuth client). */
  getAccessToken?: GetAccessToken;
  /** MCP endpoint; default `${MCP_URL}/mcp`. */
  mcpUrl?: string;
  /** Embedder for search indexing of the app's own writes; default `createEmbed()`. */
  embed?: EmbedFn;
};

export type ResolvedServerOptions = Required<Omit<AssistantServerOptions, "mcpUrl">> & {
  mcpUrl: string | undefined;
};

export function resolveServerOptions({
  resolveContext,
  getAccessToken,
  mcpUrl,
  embed,
}: AssistantServerOptions): ResolvedServerOptions {
  return {
    resolveContext,
    getAccessToken: getAccessToken ?? getAssistantAccessToken,
    mcpUrl,
    embed: embed ?? createEmbed(),
  };
}
