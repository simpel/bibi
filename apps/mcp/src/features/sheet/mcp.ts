import { mcpTool, text } from "../../tools/meta";

export const sheetMcpTools = [
  mcpTool({ operation: "sheet.list" }),
  mcpTool({ operation: "sheet.get" }),
  mcpTool({
    operation: "sheet.generate",
    idempotent: true,
    summary: ({ input }) =>
      `Generate the sheet ${text({ value: input.sheetDefinitionId })} of booking ` +
      text({ value: input.bookingId }),
  }),
  mcpTool({
    operation: "sheet.send",
    summary: ({ input }) => `Send sheet version ${text({ value: input.id })} to its role`,
  }),
];
