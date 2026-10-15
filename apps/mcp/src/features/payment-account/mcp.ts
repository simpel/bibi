import { mcpTool } from "../../tools/meta";

export const paymentAccountMcpTools = [
  mcpTool({ operation: "paymentAccount.get" }),
  mcpTool({
    operation: "paymentAccount.startOnboarding",
    idempotent: true,
    summary: () => "Connect the organization to Stripe and create an onboarding link",
  }),
  mcpTool({
    operation: "paymentAccount.sync",
    idempotent: true,
    summary: () => "Refresh the payout account status from Stripe",
  }),
];
