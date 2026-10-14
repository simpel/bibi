import { mcpTool, text } from "../../tools/meta";

export const venueMcpTools = [
  mcpTool({ operation: "venue.list" }),
  mcpTool({ operation: "venue.get" }),
  mcpTool({
    operation: "venue.create",
    summary: ({ input }) => `Create venue "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "venue.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update venue ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "venue.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive venue ${text({ value: input.id })} and all its items`,
  }),
];
