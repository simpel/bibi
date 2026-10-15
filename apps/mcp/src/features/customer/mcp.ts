import { mcpTool, text } from "../../tools/meta";
import { archiveCustomerSummary } from "./archive-summary";

export const customerMcpTools = [
  mcpTool({ operation: "customer.list" }),
  mcpTool({ operation: "customer.get" }),
  mcpTool({
    operation: "customer.create",
    summary: ({ input }) =>
      `Create customer "${text({ value: input.name })}" of type ${text({ value: input.entityTypeId })}`,
  }),
  mcpTool({
    operation: "customer.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update customer ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "customer.archive",
    destructive: true,
    idempotent: true,
    summary: archiveCustomerSummary,
  }),
];
