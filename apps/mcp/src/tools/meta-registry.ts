import { roomMcpTools } from "../features/room/mcp";
import { venueMcpTools } from "../features/venue/mcp";
import { searchMcpTools } from "../search-mcp";
import type { McpToolMeta } from "./meta";

/** Every declared operation tool; add a feature's tools here when it gets an `mcp.ts`. */
export function listMcpToolMetas(): McpToolMeta[] {
  return [...venueMcpTools, ...roomMcpTools, ...searchMcpTools];
}

export type FindMetaInput = { operation: string };

export function findMcpToolMeta({ operation }: FindMetaInput): McpToolMeta | undefined {
  return listMcpToolMetas().find((meta) => meta.operation === operation);
}
