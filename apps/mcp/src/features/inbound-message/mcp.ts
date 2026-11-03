import { mcpTool } from "../../tools/meta";
import { inboundEmailMcpTools } from "../inbound-email/mcp";

export const inboundMessageMcpTools = [
  mcpTool({ operation: "inboundMessage.list" }),
  mcpTool({ operation: "inboundMessage.openCount" }),
  mcpTool({ operation: "inboundMessage.get" }),
  mcpTool({ operation: "inboundMessage.submit" }),
  mcpTool({ operation: "inboundMessage.attachToTicket" }),
  mcpTool({ operation: "inboundMessage.markRead" }),
  mcpTool({ operation: "inboundMessage.markUnread" }),
  mcpTool({ operation: "inboundMessage.delete" }),
  mcpTool({ operation: "inboundEndpoint.list" }),
  // The deprecated `inboundEmail.*` aliases (ADR 0085).
  ...inboundEmailMcpTools,
];
