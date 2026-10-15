import { mcpTool, text } from "../../tools/meta";

export const occupancyMcpTools = [
  mcpTool({ operation: "occupancy.list" }),
  mcpTool({ operation: "occupancy.get" }),
  mcpTool({
    operation: "occupancy.create",
    summary: ({ input }) =>
      `Block item ${text({ value: input.itemId })} (${text({ value: input.type })}) from ` +
      `${text({ value: input.startsAt })} to ${text({ value: input.endsAt })}`,
  }),
  mcpTool({
    operation: "occupancy.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update occupancy ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "occupancy.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Release occupancy ${text({ value: input.id })}`,
  }),
];
