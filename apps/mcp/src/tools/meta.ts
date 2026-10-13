import { toToolName } from "./tool-name";

export type SummaryInput = { input: Record<string, unknown> };

/** One-line, human-readable proposal text shown on the approval card. */
export type SummaryFn = (args: SummaryInput) => string;

export type McpToolMetaInput = {
  /** Core operation name, e.g. `venue.create`. */
  operation: string;
  /** Marks irreversible-ish commands (archive) with `destructiveHint`. */
  destructive?: boolean;
  /** Repeating the call with the same input has no further effect. */
  idempotent?: boolean;
  summary?: SummaryFn;
};

export type McpToolMeta = McpToolMetaInput & { toolName: string };

/**
 * Declares MCP-specific metadata for a core operation; a new operation costs ~5 lines:
 * `mcpTool({ operation: "x.create", summary: ({ input }) => \`Create x ${input.name}\` })`.
 */
export function mcpTool(meta: McpToolMetaInput): McpToolMeta {
  return { ...meta, toolName: toToolName({ operation: meta.operation }) };
}

export type TextFieldInput = { value: unknown };

/** Safe string for summary templates; `input` values are unknown. */
export function text({ value }: TextFieldInput): string {
  return typeof value === "string" ? value : JSON.stringify(value ?? "");
}
