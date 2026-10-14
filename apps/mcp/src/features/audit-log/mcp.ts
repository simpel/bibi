import { mcpTool } from "../../tools/meta";

export const auditLogMcpTools = [
  mcpTool({ operation: "auditLog.list" }),
  mcpTool({ operation: "auditLog.get" }),
];
