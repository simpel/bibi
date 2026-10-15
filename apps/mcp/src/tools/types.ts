import type { ExecuteContext } from "@okazi/core";

/** Wire shape of an MCP tool result (`CallToolResult`), kept local so adapters stay SDK-free. */
export type ToolResult = {
  [key: string]: unknown;
  isError?: boolean;
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
};

export type JsonObject = Record<string, unknown>;

export type ToolAnnotations = {
  title?: string;
  readOnlyHint: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint: boolean;
};

export type RunToolInput = { args: unknown; context: ExecuteContext };

/** One MCP tool: static descriptor plus a runner that always receives the caller's context. */
export type McpTool = {
  name: string;
  description: string;
  inputSchema: JsonObject;
  outputSchema: JsonObject;
  annotations: ToolAnnotations;
  /** Extra tool metadata, e.g. the untrusted-output flag (`UNTRUSTED_OUTPUT_META_KEY`). */
  _meta?: Record<string, unknown>;
  /** Hidden from `tools/list` (and refused) when the caller is the AI actor. */
  humanOnly?: boolean;
  run(input: RunToolInput): Promise<ToolResult>;
};
