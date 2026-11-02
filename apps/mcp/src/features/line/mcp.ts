import { mcpTool, text } from "../../tools/meta";

/** One chosen option in an approval summary: its item id, with "× n" in a split group. */
const optionText = ({ option }: { option: unknown }) => {
  const { itemId, quantity } = (option ?? {}) as { itemId?: unknown; quantity?: unknown };
  const amount = typeof quantity === "number" ? ` × ${quantity}` : "";
  return `${text({ value: itemId })}${amount}`;
};

export const lineMcpTools = [
  mcpTool({ operation: "line.list" }),
  mcpTool({ operation: "line.get" }),
  mcpTool({ operation: "line.amounts" }),
  mcpTool({ operation: "line.issues" }),
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
    operation: "line.chooseOptions",
    idempotent: true,
    summary: ({ input }) =>
      `Set the options of line ${text({ value: input.lineId })} to ` +
      (Array.isArray(input.options) && input.options.length > 0
        ? input.options.map((option: unknown) => optionText({ option })).join(", ")
        : "none"),
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
    operation: "line.followStatus",
    idempotent: true,
    summary: ({ input }) =>
      `Let line ${text({ value: input.lineId })} follow the ticket's status again`,
  }),
];
