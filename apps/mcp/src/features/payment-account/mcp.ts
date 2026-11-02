import { mcpTool } from "../../tools/meta";

export const paymentAccountMcpTools = [
  mcpTool({ operation: "paymentSettings.get" }),
  mcpTool({
    operation: "paymentSettings.update",
    idempotent: true,
    summary: () => "Change the deposit rule or the invoice provider",
  }),
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
  mcpTool({
    operation: "paymentAccount.disconnect",
    idempotent: true,
    summary: () => "Disconnect the organization's Stripe account",
  }),
];
