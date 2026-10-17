import { mcpTool, text } from "../../tools/meta";

export const inquiryMcpTools = [
  mcpTool({ operation: "inquiry.list" }),
  mcpTool({ operation: "inquiry.get" }),
  mcpTool({
    operation: "inquiry.create",
    summary: ({ input }) =>
      `Register an inquiry from customer ${text({ value: input.customerId })}`,
  }),
  mcpTool({
    operation: "inquiry.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update inquiry ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "inquiry.qualify",
    summary: ({ input }) =>
      input.assigneeId === undefined
        ? `Qualify inquiry ${text({ value: input.id })}`
        : `Qualify inquiry ${text({ value: input.id })} assigned to ${text({
            value: input.assigneeId,
          })}`,
  }),
  mcpTool({
    operation: "inquiry.markLost",
    summary: ({ input }) =>
      `Mark inquiry ${text({ value: input.id })} as lost: ${text({ value: input.lossReason })}`,
  }),
];
