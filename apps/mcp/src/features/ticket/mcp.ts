import { mcpTool, text } from "../../tools/meta";

export const ticketMcpTools = [
  mcpTool({ operation: "ticket.list" }),
  mcpTool({ operation: "ticket.get" }),
  mcpTool({ operation: "ticket.export" }),
  mcpTool({
    operation: "ticket.create",
    summary: ({ input }) => `Create a ticket for customer ${text({ value: input.customerId })}`,
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
    operation: "ticket.changePhase",
    summary: ({ input }) =>
      `Move ticket ${text({ value: input.ticketId })} to phase ${text({
        value: input.phaseId,
      })}${input.reason === undefined ? "" : ` (reason: ${text({ value: input.reason })})`}`,
  }),
];
