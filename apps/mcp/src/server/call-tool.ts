import { randomUUID } from "node:crypto";
import { appError, type ExecuteContext, toMcpError } from "@okazi/core";
import { elapsedMs, getLogContext, getLogger, runWithLogContext } from "@okazi/logger";
import type { McpTool, ToolResult } from "../tools/types";

export type CallToolInput = {
  tools: readonly McpTool[];
  name: string;
  args: unknown;
  context: ExecuteContext;
};

async function run({ tools, name, args, context }: CallToolInput): Promise<ToolResult> {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) {
    return toMcpError({ error: appError({ code: "NOT_FOUND", message: `Unknown tool ${name}` }) });
  }
  return tool.run({ args, context });
}

async function logged({ tools, name, args, context }: CallToolInput): Promise<ToolResult> {
  const since = performance.now();
  const result = await run({ tools, name, args, context });
  getLogger()[result.isError ? "warn" : "info"]({
    event: "mcp.toolCalled",
    tool: name,
    outcome: result.isError ? "error" : "ok",
    durationMs: elapsedMs({ since }),
  });
  return result;
}

/**
 * One `mcp.toolCalled` line per call (ADR 0014). Over HTTP the call inherits the request's log
 * context; over stdio there is no request, so each call gets its own `requestId`.
 */
export function callTool({ tools, name, args, context }: CallToolInput): Promise<ToolResult> {
  const input = { tools, name, args, context };
  if (getLogContext()?.requestId) return logged(input);
  const { organizationId, actor } = context;
  return runWithLogContext({
    context: {
      requestId: randomUUID(),
      surface: "mcp",
      organizationId,
      userId: actor.userId,
      actorType: actor.type,
    },
    fn: () => logged(input),
  });
}
