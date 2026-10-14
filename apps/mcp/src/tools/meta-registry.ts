import { conversationMcpTools } from "../features/conversation/mcp";
import { messageMcpTools } from "../features/message/mcp";
import { roomMcpTools } from "../features/room/mcp";
import { skillMcpTools } from "../features/skill/mcp";
import { venueMcpTools } from "../features/venue/mcp";
import { searchMcpTools } from "../search-mcp";
import type { McpToolMeta } from "./meta";

/** Every declared operation tool; add a feature's tools here when it gets an `mcp.ts`. */
export function listMcpToolMetas(): McpToolMeta[] {
  return [
    ...venueMcpTools,
    ...roomMcpTools,
    ...conversationMcpTools,
    ...messageMcpTools,
    ...skillMcpTools,
    ...searchMcpTools,
  ];
}

export type FindMetaInput = { operation: string };

export function findMcpToolMeta({ operation }: FindMetaInput): McpToolMeta | undefined {
  return listMcpToolMetas().find((meta) => meta.operation === operation);
}
