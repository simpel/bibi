import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { EmbedFn, ExecuteContext } from "@okazi/core";
import { withOrgDescriptions } from "../tools/org-tool-descriptions";
import type { McpTool, ToolResult } from "../tools/types";
import { callTool } from "./call-tool";
import { createTools } from "./create-tools";

export type CreateMcpServerInput = { context: ExecuteContext; embed: EmbedFn };

export const SERVER_INFO = { name: "okazi", version: "0.0.0" };

type VisibleInput = { tools: McpTool[]; context: ExecuteContext };

/** The AI actor never sees (or may call) human-only tools such as `approval_confirm`. */
function visibleTools({ tools, context }: VisibleInput): McpTool[] {
  return tools.filter((tool) => !(tool.humanOnly && context.actor.type === "ai"));
}

/**
 * MCP server bound to one caller. Built per request in HTTP (stateless) and once for stdio.
 * Uses the low-level `Server` so tool schemas come from Zod via `z.toJSONSchema` (dates as ISO
 * strings) and input validation is done once, by core's `execute`.
 */
export function createMcpServer({ context, embed }: CreateMcpServerInput): Server {
  const tools = visibleTools({ tools: createTools({ embed }), context });
  const server = new Server(SERVER_INFO, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: (await withOrgDescriptions({ tools, context })).map(
      ({ run: _run, humanOnly: _humanOnly, ...descriptor }) => descriptor,
    ),
  }));
  server.setRequestHandler(
    CallToolRequestSchema,
    ({ params }): Promise<ToolResult> =>
      callTool({ tools, name: params.name, args: params.arguments ?? {}, context }),
  );
  return server;
}
