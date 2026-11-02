import { mcpTool } from "../../tools/meta";
import { inboundEmailMcpTools } from "../inbound-email/mcp";

export const inboundMessageMcpTools = [
  mcpTool({ operation: "inboundMessage.list" }),
  mcpTool({ operation: "inboundMessage.get" }),
  mcpTool({ operation: "inboundMessage.submit" }),
  mcpTool({ operation: "inboundMessage.attachToTicket" }),
  mcpTool({ operation: "inboundMessage.dismiss" }),
  mcpTool({ operation: "inboundMessage.restore" }),
  mcpTool({ operation: "inboundEndpoint.list" }),
  // The deprecated `inboundEmail.*` aliases (ADR 0085).
  ...inboundEmailMcpTools,
];
