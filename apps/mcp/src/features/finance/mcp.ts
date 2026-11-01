import { mcpTool } from "../../tools/meta";

export const financeMcpTools = [
  mcpTool({ operation: "finance.overview" }),
  mcpTool({ operation: "accountingSettings.get" }),
  mcpTool({
    operation: "accountingSettings.update",
    idempotent: true,
    summary: () => "Change the accounts the SIE export posts to",
  }),
  mcpTool({ operation: "accountingExport.preview" }),
  mcpTool({
    operation: "accountingExport.create",
    summary: () => "Create the next SIE export of everything not exported yet",
  }),
  mcpTool({ operation: "accountingExport.list" }),
  mcpTool({ operation: "accountingExport.get" }),
  mcpTool({ operation: "accountingExport.download" }),
];
