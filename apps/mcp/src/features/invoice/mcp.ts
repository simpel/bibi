import { mcpTool, text } from "../../tools/meta";

export const invoiceMcpTools = [
  mcpTool({ operation: "invoice.list" }),
  mcpTool({ operation: "invoice.get" }),
  mcpTool({
    operation: "invoice.create",
    summary: ({ input }) =>
      `Invoice order ${text({ value: input.orderId })}, freezing its priced lines`,
  }),
  mcpTool({
    operation: "invoice.send",
    summary: ({ input }) => `Mark invoice ${text({ value: input.id })} as sent`,
  }),
  mcpTool({
    operation: "invoice.sync",
    summary: ({ input }) => `Refresh invoice ${text({ value: input.id })} from its provider`,
  }),
  mcpTool({
    operation: "invoice.void",
    destructive: true,
    summary: ({ input }) => `Void invoice ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "invoice.credit",
    destructive: true,
    summary: ({ input }) => {
      const what =
        typeof input.amountMinor === "number"
          ? `${(input.amountMinor / 100).toFixed(2)} SEK`
          : Array.isArray(input.lineIds)
            ? `${input.lineIds.length} lines`
            : "what is still due";
      return `Credit ${what} of invoice ${text({ value: input.invoiceId })}`;
    },
  }),
];
