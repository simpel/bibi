import type { AnyOperation } from "@bibi/core";
import type { McpToolMeta } from "./meta";
import type { ToolAnnotations } from "./types";

export type AnnotationsInput = { operation: AnyOperation; meta: McpToolMeta | undefined };

/** MCP hints derived from operation kind plus the feature's `mcp.ts` flags. */
export function toAnnotations({ operation, meta }: AnnotationsInput): ToolAnnotations {
  if (operation.kind === "query") {
    return { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
  }
  return {
    readOnlyHint: false,
    destructiveHint: meta?.destructive ?? false,
    idempotentHint: meta?.idempotent ?? false,
    openWorldHint: false,
  };
}
