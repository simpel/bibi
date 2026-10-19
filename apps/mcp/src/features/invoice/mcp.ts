import { mcpTool, text } from "../../tools/meta";

export const invoiceMcpTools = [
  mcpTool({ operation: "invoice.list" }),
  mcpTool({ operation: "invoice.get" }),
  mcpTool({
    operation: "invoice.create",
    summary: ({ input }) =>
      `Invoice ticket ${text({ value: input.ticketId })}, freezing its priced lines`,
  }),
  mcpTool({
    operation: "invoice.send",
    summary: ({ input }) => `Mark invoice ${text({ value: input.id })} as sent`,
  }),
  mcpTool({
    operation: "invoice.void",
    destructive: true,
    summary: ({ input }) => `Void invoice ${text({ value: input.id })}`,
  }),
];
