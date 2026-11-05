import { mcpTool, text } from "../../tools/meta";

export const runSheetMcpTools = [
  mcpTool({ operation: "runSheet.list" }),
  mcpTool({ operation: "runSheet.get" }),
  mcpTool({
    operation: "runSheet.generate",
    idempotent: true,
    summary: ({ input }) =>
      `Generate the run sheet ${text({ value: input.runSheetDefinitionId })} of order ` +
      text({ value: input.orderId }),
  }),
  mcpTool({
    operation: "runSheet.publish",
    summary: ({ input }) => `Publish run sheet version ${text({ value: input.id })} to its role`,
  }),
  mcpTool({
    operation: "runSheet.fulfill",
    summary: ({ input }) =>
      `Mark run sheet version ${text({ value: input.id })} as fulfilled (done)`,
  }),
  mcpTool({
    operation: "runSheet.unfulfill",
    summary: ({ input }) => `Reopen fulfilled run sheet version ${text({ value: input.id })}`,
  }),
];
