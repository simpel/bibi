import { mcpTool, text } from "../../tools/meta";

export const lineAllocationMcpTools = [
  mcpTool({ operation: "lineAllocation.list" }),
  mcpTool({ operation: "lineAllocation.get" }),
  mcpTool({
    operation: "lineAllocation.assign",
    idempotent: true,
    summary: ({ input }) =>
      input.unitId
        ? `Allocate unit ${text({ value: input.unitId })} to ${text({ value: input.id })}`
        : `Leave allocation ${text({ value: input.id })} unfilled`,
  }),
];
