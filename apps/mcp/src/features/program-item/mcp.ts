import { mcpTool, text } from "../../tools/meta";

export const programItemMcpTools = [
  mcpTool({ operation: "programItem.list" }),
  mcpTool({ operation: "programItem.get" }),
  mcpTool({
    operation: "programItem.create",
    summary: ({ input }) =>
      `Add "${text({ value: input.name })}" to ticket ${text({ value: input.ticketId })} ` +
      `from ${text({ value: input.startsAt })} to ${text({ value: input.endsAt })}`,
  }),
  mcpTool({
    operation: "programItem.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update program item ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "programItem.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Remove program item ${text({ value: input.id })} from the schedule`,
  }),
  mcpTool({
    operation: "line.changeState",
    idempotent: true,
    summary: ({ input }) =>
      `Set line ${text({ value: input.lineId })} to state ${text({ value: input.stateId })}`,
  }),
];
