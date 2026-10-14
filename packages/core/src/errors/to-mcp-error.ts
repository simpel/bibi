import type { AppError } from "./app-error";

/** Shape of an MCP `CallToolResult` describing a failed tool call. */
export type McpErrorResult = {
  isError: true;
  content: { type: "text"; text: string }[];
  structuredContent: { code: AppError["code"]; message: string; issues: AppError["issues"] };
};

export type ToMcpErrorInput = { error: AppError };

export function toMcpError({ error }: ToMcpErrorInput): McpErrorResult {
  const detail = error.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
  const text = detail
    ? `${error.code}: ${error.message} (${detail})`
    : `${error.code}: ${error.message}`;
  return {
    isError: true,
    content: [{ type: "text", text }],
    structuredContent: { code: error.code, message: error.message, issues: error.issues },
  };
}
