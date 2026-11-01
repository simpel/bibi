import { mcpTool, text } from "../../tools/meta";

export const ticketMcpTools = [
  mcpTool({ operation: "ticket.list" }),
  mcpTool({ operation: "ticket.get" }),
  mcpTool({ operation: "ticket.export" }),
  mcpTool({ operation: "ticket.statusHistory" }),
  mcpTool({ operation: "ticket.estimateHistory" }),
  mcpTool({ operation: "ticket.previewLines" }),
  mcpTool({
    operation: "ticket.create",
    summary: ({ input }) => {
      const lines = Array.isArray(input.lines) ? input.lines.length : 0;
      const withLines = lines > 0 ? ` with ${lines} line(s)` : "";
      return `Create a ticket for customer ${text({ value: input.customerId })}${withLines}`;
    },
  }),
  mcpTool({
    operation: "ticket.createFromTemplate",
    summary: ({ input }) =>
      `Create a ticket for customer ${text({ value: input.customerId })} from predefined ticket ` +
      `${text({ value: input.templateId })} starting ${text({ value: input.startsAt })}`,
  }),
  mcpTool({
    operation: "ticket.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update ticket ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "ticket.expireHolds",
    destructive: true,
    idempotent: true,
    summary: () => "Expire the soft holds of every ticket whose holdsUntil date has passed",
  }),
  mcpTool({
    operation: "ticket.changeStatus",
    summary: ({ input }) =>
      `Move ticket ${text({ value: input.ticketId })} to status ${text({
        value: input.statusId,
      })}${input.reason === undefined ? "" : ` (reason: ${text({ value: input.reason })})`}`,
  }),
];
