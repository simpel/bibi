import { mcpTool, text } from "../../tools/meta";

type AmountInput = { input: Record<string, unknown> };

/** `125000` minor units in SEK → `1250.00 SEK`. */
const amount = ({ input }: AmountInput): string => {
  const minor = typeof input.amountMinor === "number" ? input.amountMinor : 0;
  const currency = typeof input.currency === "string" ? input.currency.toUpperCase() : "SEK";
  return `${(minor / 100).toFixed(2)} ${currency}`;
};

export const paymentMcpTools = [
  mcpTool({ operation: "payment.list" }),
  mcpTool({ operation: "payment.get" }),
  mcpTool({
    operation: "payment.create",
    summary: ({ input }) =>
      `Request ${amount({ input })} by ${input.method === "INVOICE" ? "invoice" : "card"} ` +
      `for ticket ${text({ value: input.ticketId })}`,
  }),
];
