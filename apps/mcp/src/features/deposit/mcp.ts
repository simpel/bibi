import { mcpTool, text } from "../../tools/meta";

/** `125000` minor units → `1250.00 SEK`. */
const kronor = ({ value }: { value: unknown }): string =>
  `${((typeof value === "number" ? value : 0) / 100).toFixed(2)} SEK`;

export const depositMcpTools = [
  mcpTool({ operation: "deposit.list" }),
  mcpTool({ operation: "deposit.get" }),
  mcpTool({
    operation: "deposit.create",
    summary: ({ input }) =>
      `Create a deposit request of ${kronor({ value: input.amountMinor })} ` +
      `("${text({ value: input.description })}") on ticket ${text({ value: input.ticketId })}`,
  }),
  mcpTool({
    operation: "deposit.send",
    summary: ({ input }) => `Mark deposit request ${text({ value: input.id })} as sent`,
  }),
  mcpTool({
    operation: "deposit.void",
    destructive: true,
    summary: ({ input }) => `Void deposit request ${text({ value: input.id })}`,
  }),
];
