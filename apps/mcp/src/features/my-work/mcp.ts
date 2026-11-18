import { mcpTool } from "../../tools/meta";

export const myWorkMcpTools = [
  mcpTool({ operation: "myWork.view" }),
  mcpTool({ operation: "myWork.tasks" }),
  mcpTool({ operation: "myWork.dismissTask", idempotent: true }),
];
