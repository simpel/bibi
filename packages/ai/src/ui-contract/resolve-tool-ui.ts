import { z } from "zod";
import { readApproval } from "../approval/approval-schema";
import { TOOL_UI_REGISTRY } from "./tool-ui-registry";
import type { ToolUi } from "./tool-ui-types";
import { McpErrorWireSchema } from "./wire-schemas";

const McpResultSchema = z.looseObject({
  isError: z.boolean().optional(),
  structuredContent: z.unknown().optional(),
});

type Normalized = { isError: boolean; value: unknown };

/** MCP `CallToolResult` → its structured content; local tool outputs pass through. */
const normalize = ({ output }: { output: unknown }): Normalized => {
  const mcp = McpResultSchema.safeParse(output);
  if (mcp.success && ("structuredContent" in mcp.data || "isError" in mcp.data)) {
    return { isError: mcp.data.isError === true, value: mcp.data.structuredContent };
  }
  return { isError: false, value: output };
};

export type ResolveToolUiInput = { toolName: string; output: unknown };

/**
 * Which UI component renders a tool result, with validated props. Order: tool error → `error`,
 * approval proposal → `approval-card`, registry entry → its component, otherwise `json`.
 */
export function resolveToolUi({ toolName, output }: ResolveToolUiInput): ToolUi {
  const { isError, value } = normalize({ output });
  if (isError) {
    const error = McpErrorWireSchema.safeParse(value);
    const props = error.success ? error.data : { code: "INTERNAL", message: "Tool failed" };
    return { component: "error", props };
  }
  const approval = readApproval({ output: value });
  if (approval) return { component: "approval-card", props: { approval } };
  const resolved = TOOL_UI_REGISTRY[toolName]?.resolve({ value });
  return resolved ?? { component: "json", props: { value } };
}
