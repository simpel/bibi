import { mcpTool, text } from "../../tools/meta";

export const orderMcpTools = [
  mcpTool({ operation: "order.list" }),
  mcpTool({ operation: "order.get" }),
  mcpTool({ operation: "order.view" }),
  mcpTool({ operation: "order.export" }),
  mcpTool({ operation: "order.statusHistory" }),
  mcpTool({ operation: "order.estimateHistory" }),
  mcpTool({ operation: "order.previewLines" }),
  mcpTool({
    operation: "order.create",
    summary: ({ input }) => {
      const lines = Array.isArray(input.lines) ? input.lines.length : 0;
      const withLines = lines > 0 ? ` with ${lines} line(s)` : "";
      return `Create an order for customer ${text({ value: input.customerId })}${withLines}`;
    },
  }),
  mcpTool({
    operation: "order.createFromTemplate",
    summary: ({ input }) =>
      `Create an order for customer ${text({ value: input.customerId })} from predefined order ` +
      `${text({ value: input.templateId })} starting ${text({ value: input.startsAt })}`,
  }),
  mcpTool({
    operation: "order.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update order ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "order.expireHolds",
    destructive: true,
    idempotent: true,
    summary: () => "Expire the soft holds of every order whose holdsUntil date has passed",
  }),
  mcpTool({
    operation: "order.changeStatus",
    summary: ({ input }) =>
      `Move order ${text({ value: input.orderId })} to status ${text({
        value: input.statusId,
      })}${input.reason === undefined ? "" : ` (reason: ${text({ value: input.reason })})`}`,
  }),
];
