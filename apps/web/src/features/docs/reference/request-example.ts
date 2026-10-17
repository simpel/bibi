import { exampleValue } from "./example-value";
import type { ReferenceEntry } from "./types";

export type ToolCallExampleInput = { entry: ReferenceEntry };

/** JSON-RPC `tools/call` request for an MCP tool, with the required arguments. */
export function toolCallExample({ entry }: ToolCallExampleInput): string {
  const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: entry.toolName, arguments: exampleValue({ schema: entry.input }) },
  };
  return JSON.stringify(request, null, 2);
}
