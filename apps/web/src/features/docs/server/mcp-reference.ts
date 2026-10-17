import "server-only";
import { toJsonSchema } from "@okazi/api";
import type { AnyOperation } from "@okazi/core";
import { ensureOperations } from "@/server/operations";
import type { ReferenceEntry } from "../reference/types";
import { GENERIC_MCP_TOOLS } from "./generic-mcp-tools";

type ToEntryInput = { operation: AnyOperation };

/** Mirrors the MCP server: one tool per core operation, named `venue.create` → `venue_create`. */
function toEntry({ operation }: ToEntryInput): ReferenceEntry {
  const toolName = operation.name.replaceAll(".", "_");
  return {
    id: toolName,
    toolName,
    group: operation.name.split(".")[0] ?? "other",
    operation: operation.name,
    summary: operation.description,
    permission: operation.permission,
    readOnly: operation.kind === "query",
    approval: operation.kind === "command" && operation.approval,
    input: toJsonSchema({ schema: operation.input, io: "input" }),
    output: toJsonSchema({ schema: operation.output, io: "output" }),
  };
}

/** Every MCP tool the server lists for a signed-in user, plus the generic graph tools. */
export function mcpReference(): ReferenceEntry[] {
  const tools = [...ensureOperations()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((operation) => toEntry({ operation }));
  return [...tools, ...GENERIC_MCP_TOOLS];
}
