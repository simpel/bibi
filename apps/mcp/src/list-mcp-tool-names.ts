import { listMcpToolMetas } from "./tools/meta-registry";

/** Tool names declared by feature `mcp.ts` files; the parity test maps core operations onto them. */
export function listMcpToolNames(): string[] {
  return listMcpToolMetas()
    .map((meta) => meta.toolName)
    .sort();
}

/** Operation names with a declared MCP tool (parity test diffs this against `listOperations()`). */
export function listMcpOperationNames(): string[] {
  return listMcpToolMetas()
    .map((meta) => meta.operation)
    .sort();
}
