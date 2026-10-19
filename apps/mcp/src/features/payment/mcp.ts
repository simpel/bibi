import { mcpTool, text } from "../../tools/meta";

type AmountInput = { input: Record<string, unknown> };

/** `125000` minor units → `1250.00 SEK`; no amount means the receivable's open balance. */
const amount = ({ input }: AmountInput): string =>
  typeof input.amountMinor === "number"
    ? `${(input.amountMinor / 100).toFixed(2)} SEK`
    : "the open balance";

/** `quote q1`, `deposit d1` or `invoice i1`: the receivable a payment settles. */
const receivable = ({ input }: AmountInput): string => {
  if (input.depositId !== undefined) return `deposit ${text({ value: input.depositId })}`;
  if (input.invoiceId !== undefined) return `invoice ${text({ value: input.invoiceId })}`;
  return `quote ${text({ value: input.quoteId })}`;
};

export const paymentMcpTools = [
  mcpTool({ operation: "payment.list" }),
  mcpTool({ operation: "payment.get" }),
  mcpTool({ operation: "payment.balance" }),
  mcpTool({
    operation: "payment.create",
    summary: ({ input }) =>
      `Request ${amount({ input })} by ${input.method === "INVOICE" ? "invoice" : "card"} ` +
      `against ${receivable({ input })}`,
  }),
];
