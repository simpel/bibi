import { type EmbedFn, type ExecuteContext, hasPermission } from "@bibi/core";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { withOrgDescriptions } from "../tools/org-tool-descriptions";
import type { McpTool, ToolResult } from "../tools/types";
import { callTool } from "./call-tool";
import { createTools } from "./create-tools";

export type CreateMcpServerInput = { context: ExecuteContext; embed: EmbedFn };

export const SERVER_INFO = { name: "bibi", version: "0.0.0" };

type VisibleInput = { tools: McpTool[]; context: ExecuteContext };

/** The AI actor never sees (or may call) human-only tools such as `approval_confirm`. */
function visibleTools({ tools, context }: VisibleInput): McpTool[] {
  return tools.filter((tool) => !(tool.humanOnly && context.actor.type === "ai"));
}

/**
 * The tools in `tools/list` (ADR 0048): commands the caller has no permission for are left out,
 * so the assistant never proposes them. A direct call still reaches `execute` and gets FORBIDDEN.
 */
function listedTools({ tools, context }: VisibleInput): McpTool[] {
  return tools.filter(
    ({ writePermission: permission }) =>
      !permission || hasPermission({ permissions: context.permissions, permission }),
  );
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
    tools: (await withOrgDescriptions({ tools: listedTools({ tools, context }), context })).map(
      ({ run: _run, humanOnly: _humanOnly, writePermission: _permission, ...descriptor }) =>
        descriptor,
    ),
  }));
  server.setRequestHandler(
    CallToolRequestSchema,
    ({ params }): Promise<ToolResult> =>
      callTool({ tools, name: params.name, args: params.arguments ?? {}, context }),
  );
  return server;
}
