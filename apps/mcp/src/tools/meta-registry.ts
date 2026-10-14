import { configurationMcpTools } from "../features/configuration/mcp";
import { conversationMcpTools } from "../features/conversation/mcp";
import { entityTypeMcpTools } from "../features/entity-type/mcp";
import { fieldDefinitionMcpTools } from "../features/field-definition/mcp";
import { itemMcpTools } from "../features/item/mcp";
import { memberMcpTools } from "../features/member/mcp";
import { messageMcpTools } from "../features/message/mcp";
import { roleMcpTools } from "../features/role/mcp";
import { setupMcpTools } from "../features/setup/mcp";
import { skillMcpTools } from "../features/skill/mcp";
import { venueMcpTools } from "../features/venue/mcp";
import { vocabularyMcpTools } from "../features/vocabulary/mcp";
import { searchMcpTools } from "../search-mcp";
import type { McpToolMeta } from "./meta";

/** Every declared operation tool; add a feature's tools here when it gets an `mcp.ts`. */
export function listMcpToolMetas(): McpToolMeta[] {
  return [
    ...venueMcpTools,
    ...entityTypeMcpTools,
    ...fieldDefinitionMcpTools,
    ...vocabularyMcpTools,
    ...setupMcpTools,
    ...configurationMcpTools,
    ...itemMcpTools,
    ...conversationMcpTools,
    ...messageMcpTools,
    ...skillMcpTools,
    ...roleMcpTools,
    ...memberMcpTools,
    ...searchMcpTools,
  ];
}

export type FindMetaInput = { operation: string };

export function findMcpToolMeta({ operation }: FindMetaInput): McpToolMeta | undefined {
  return listMcpToolMetas().find((meta) => meta.operation === operation);
}
