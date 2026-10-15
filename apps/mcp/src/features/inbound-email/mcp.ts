import { mcpTool } from "../../tools/meta";

export const inboundEmailMcpTools = [
  mcpTool({ operation: "inboundEmail.list" }),
  mcpTool({ operation: "inboundEmail.get" }),
];
