import { mcpTool } from "../../tools/meta";

export const billingMcpTools = [
  mcpTool({ operation: "billing.get" }),
  mcpTool({ operation: "billing.access" }),
  mcpTool({ operation: "billing.listSeatRequests" }),
  mcpTool({
    operation: "billing.startCheckout",
    idempotent: true,
    summary: () => "Create a Stripe checkout link for the Bibi subscription",
  }),
  mcpTool({
    operation: "billing.openPortal",
    idempotent: true,
    summary: () => "Open the Stripe portal for the Bibi subscription",
  }),
  mcpTool({
    operation: "billing.sync",
    idempotent: true,
    summary: () => "Refresh the subscription from Stripe",
  }),
  mcpTool({
    operation: "billing.update",
    idempotent: true,
    summary: () => "Change automatic seat assignment or the number of extra seats",
  }),
  mcpTool({
    operation: "billing.approveSeat",
    idempotent: true,
    summary: () => "Approve a seat for a held invitation and send it",
  }),
  mcpTool({
    operation: "billing.rejectSeat",
    idempotent: true,
    summary: () => "Reject a held invitation",
  }),
  mcpTool({
    operation: "billing.remindAdmins",
    summary: () => "Remind the admins to pay for the subscription",
  }),
];
