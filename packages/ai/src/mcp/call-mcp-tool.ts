import type { MCPClient } from "@ai-sdk/mcp";
import { APP_ERROR_CODES, AppError, err, fromUnknown, ok, type Result } from "@bibi/core";
import { z } from "zod";

const McpErrorSchema = z.object({
  code: z.enum(APP_ERROR_CODES),
  message: z.string(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).default([]),
});

const ToolResultSchema = z.looseObject({
  isError: z.boolean().optional(),
  structuredContent: z.record(z.string(), z.unknown()).optional(),
});

export type CallMcpToolInput = {
  client: MCPClient;
  name: string;
  args?: Record<string, unknown>;
};

type ToErrorInput = { structured: unknown; name: string };

const toError = ({ structured, name }: ToErrorInput): AppError => {
  const parsed = McpErrorSchema.safeParse(structured);
  if (parsed.success) return new AppError(parsed.data);
  return new AppError({ code: "INTERNAL", message: `MCP tool ${name} failed` });
};

/**
 * Calls an MCP tool and returns its `structuredContent` as a Result; `isError` results are mapped
 * back to the core `AppError` (same codes as every other surface).
 */
export async function callMcpTool({
  client,
  name,
  args = {},
}: CallMcpToolInput): Promise<Result<Record<string, unknown>>> {
  try {
    const raw = ToolResultSchema.parse(await client.callTool({ name, arguments: args }));
    if (raw.isError) return err({ error: toError({ structured: raw.structuredContent, name }) });
    if (!raw.structuredContent) {
      const message = `MCP tool ${name} returned no structured content`;
      return err({ error: new AppError({ code: "INTERNAL", message }) });
    }
    return ok({ value: raw.structuredContent });
  } catch (error) {
    return err({ error: fromUnknown({ error }) });
  }
}
