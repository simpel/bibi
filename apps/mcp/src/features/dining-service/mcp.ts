import { mcpTool, text } from "../../tools/meta";

export const diningServiceMcpTools = [
  mcpTool({ operation: "diningService.list" }),
  mcpTool({ operation: "diningService.get" }),
  mcpTool({
    operation: "diningService.create",
    summary: ({ input }) =>
      `Create sitting ${text({ value: input.name })} in room ${text({ value: input.roomItemId })}`,
  }),
  mcpTool({
    operation: "diningService.update",
    idempotent: true,
    summary: ({ input }) =>
      `Edit sitting ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "diningService.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive sitting ${text({ value: input.id })}`,
  }),
  mcpTool({ operation: "diningServiceException.list" }),
  mcpTool({
    operation: "diningServiceException.set",
    idempotent: true,
    summary: ({ input }) =>
      `${input.closed === true ? "Close" : "Change"} sitting ${text({ value: input.serviceId })} on ${text({ value: input.date })}`,
  }),
  mcpTool({
    operation: "diningServiceException.delete",
    destructive: true,
    summary: ({ input }) =>
      `Remove the exception of sitting ${text({ value: input.serviceId })} on ${text({ value: input.date })}`,
  }),
];
