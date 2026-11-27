import { mcpTool } from "../../tools/meta";

export const financeMcpTools = [
  mcpTool({ operation: "finance.overview" }),
  mcpTool({ operation: "accountMapping.list" }),
  mcpTool({
    operation: "accountMapping.set",
    idempotent: true,
    summary: () => "Change the accounts the organization's purposes book to",
  }),
];
