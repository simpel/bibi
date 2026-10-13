import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { appError, type EmbedFn, type ExecuteContext, toMcpError } from "@okazi/core";
import type { McpTool, ToolResult } from "../tools/types";
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
    tools: tools.map(({ run: _run, humanOnly: _humanOnly, ...descriptor }) => descriptor),
  }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }): Promise<ToolResult> => {
    const tool = tools.find((candidate) => candidate.name === params.name);
    if (!tool) {
      return toMcpError({
        error: appError({ code: "NOT_FOUND", message: `Unknown tool ${params.name}` }),
      });
    }
    return tool.run({ args: params.arguments ?? {}, context });
  });
  return server;
}
