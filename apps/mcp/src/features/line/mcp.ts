import { mcpTool, text } from "../../tools/meta";

export const lineMcpTools = [
  mcpTool({ operation: "line.list" }),
  mcpTool({ operation: "line.get" }),
  mcpTool({
    operation: "line.create",
    summary: ({ input }) =>
      `Add "${text({ value: input.name })}" to ticket ${text({ value: input.ticketId })} ` +
      (input.startsAt && input.endsAt
        ? `from ${text({ value: input.startsAt })} to ${text({ value: input.endsAt })}`
        : "without a time"),
  }),
  mcpTool({
    operation: "line.expandBundle",
    summary: ({ input }) =>
      `Add bundle ${text({ value: input.itemId })} to ticket ${text({ value: input.ticketId })} ` +
      "as a bundle line with its part lines" +
      (input.startsAt ? ` from ${text({ value: input.startsAt })}` : ", without a time"),
  }),
  mcpTool({
    operation: "line.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update line ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "line.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Remove line ${text({ value: input.id })} from the schedule`,
  }),
  mcpTool({
    operation: "line.changeState",
    idempotent: true,
    summary: ({ input }) =>
      `Set line ${text({ value: input.lineId })} to state ${text({ value: input.stateId })}`,
  }),
  mcpTool({
    operation: "line.followPhase",
    idempotent: true,
    summary: ({ input }) =>
      `Let line ${text({ value: input.lineId })} follow the ticket's phase again`,
  }),
];
