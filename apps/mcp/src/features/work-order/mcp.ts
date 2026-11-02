import { mcpTool, text } from "../../tools/meta";

export const workOrderMcpTools = [
  mcpTool({ operation: "workOrder.list" }),
  mcpTool({ operation: "workOrder.get" }),
  mcpTool({
    operation: "workOrder.generate",
    idempotent: true,
    summary: ({ input }) =>
      `Generate the work order ${text({ value: input.workOrderDefinitionId })} of ticket ` +
      text({ value: input.ticketId }),
  }),
  mcpTool({
    operation: "workOrder.send",
    summary: ({ input }) => `Send work order version ${text({ value: input.id })} to its role`,
  }),
];
