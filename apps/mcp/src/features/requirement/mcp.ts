import { mcpTool, text } from "../../tools/meta";

export const requirementMcpTools = [
  mcpTool({ operation: "requirement.list" }),
  mcpTool({ operation: "requirement.get" }),
  mcpTool({
    operation: "requirement.create",
    summary: ({ input }) =>
      `Count ${text({ value: input.quantity })} × list value ` +
      `${text({ value: input.vocabularyValueId })} on ` +
      (input.lineId
        ? `line ${text({ value: input.lineId })}`
        : `ticket ${text({ value: input.ticketId })}`),
  }),
  mcpTool({
    operation: "requirement.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update requirement ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "requirement.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Remove requirement ${text({ value: input.id })}`,
  }),
];
