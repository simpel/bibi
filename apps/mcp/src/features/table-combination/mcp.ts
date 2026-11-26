import { mcpTool, text } from "../../tools/meta";

export const tableCombinationMcpTools = [
  mcpTool({ operation: "tableCombination.list" }),
  mcpTool({
    operation: "tableCombination.save",
    idempotent: true,
    summary: ({ input }) =>
      `Save ${Array.isArray(input.combinations) ? input.combinations.length : 0} table combinations for layout ${text({ value: input.layoutId })}`,
  }),
];
