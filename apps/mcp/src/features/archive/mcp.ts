import { mcpTool } from "../../tools/meta";

/** The Archive page (ADR 0118); restore and delete are each entity's own tools. */
export const archiveMcpTools = [mcpTool({ operation: "archive.list" })];
