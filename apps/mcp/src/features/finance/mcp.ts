import { mcpTool } from "../../tools/meta";

export const financeMcpTools = [
  mcpTool({ operation: "finance.overview" }),
  mcpTool({ operation: "accountingSettings.get" }),
  mcpTool({
    operation: "accountingSettings.update",
    idempotent: true,
    summary: () => "Change the accounts invoice rows post to",
  }),
];
