import type { ExecuteContext, Result } from "@okazi/core";
import { toToolName } from "./tool-name";

/** `context` is the proposing caller's, for summaries that must read data (e.g. counts). */
export type SummaryInput = { input: Record<string, unknown>; context: ExecuteContext };

/** One-line, human-readable proposal text shown on the approval card. */
export type SummaryFn = (args: SummaryInput) => string | Promise<string>;

/**
 * Server-side facts added to a proposal's input before it is signed (#144), e.g. the count the
 * approval card shows, so the operation can refuse on confirm if they changed. An error refuses
 * the proposal.
 */
export type BindFn = (args: SummaryInput) => Promise<Result<Record<string, unknown>>>;

export type McpToolMetaInput = {
  /** Core operation name, e.g. `venue.create`. */
  operation: string;
  /** Marks irreversible-ish commands (archive) with `destructiveHint`. */
  destructive?: boolean;
  /** Repeating the call with the same input has no further effect. */
  idempotent?: boolean;
  summary?: SummaryFn;
  bind?: BindFn;
};

export type McpToolMeta = McpToolMetaInput & { toolName: string };

/**
 * Declares MCP-specific metadata for a core operation; a new operation costs ~5 lines:
 * `mcpTool({ operation: "x.create", summary: ({ input }) => \`Create x ${input.name}\` })`.
 */
export function mcpTool({
  operation,
  destructive,
  idempotent,
  summary,
  bind,
}: McpToolMetaInput): McpToolMeta {
  const toolName = toToolName({ operation });
  return { operation, destructive, idempotent, summary, bind, toolName };
}

export type TextFieldInput = { value: unknown };

/** Safe string for summary templates; `input` values are unknown. */
export function text({ value }: TextFieldInput): string {
  return typeof value === "string" ? value : JSON.stringify(value ?? "");
}
