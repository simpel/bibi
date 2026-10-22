import { getFirstPartyAccessToken } from "@bibi/auth";
import type { EmbedFn, Result } from "@bibi/core";
import { createEmbed } from "../embeddings/create-embed";
import type { ResolveContext } from "./resolve-user";

/** MCP access token for the verified user (+ org) behind the request's session. */
export type GetAccessToken = (input: {
  headers: Headers;
  caller: { userId: string; organizationId: string };
}) => Promise<Result<string>>;

/** First-party client `assistant` (the only one whose tokens may carry the AI actor). */
const assistantAccessToken: GetAccessToken = ({ headers, caller }) =>
  getFirstPartyAccessToken({ client: "assistant", headers, caller });

/** Dependencies shared by the chat and approval handlers (all injectable for tests). */
export type AssistantServerOptions = {
  /** Resolves the caller from request headers: `resolveExecuteContext` from `@bibi/auth`. */
  resolveContext: ResolveContext;
  /** MCP token for the user; default `getFirstPartyAccessToken({ client: "assistant" })`. */
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
    getAccessToken: getAccessToken ?? assistantAccessToken,
    mcpUrl,
    embed: embed ?? createEmbed(),
  };
}
