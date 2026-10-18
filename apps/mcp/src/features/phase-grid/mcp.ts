import { mcpTool, text } from "../../tools/meta";

export const phaseGridMcpTools = [
  mcpTool({ operation: "phaseGrid.get" }),
  mcpTool({
    operation: "phaseGrid.setCell",
    idempotent: true,
    summary: ({ input }) =>
      input.stateId === null
        ? `Clear the grid cell of phase ${text({ value: input.phaseId })} and item type ` +
          `${text({ value: input.entityTypeId })} (lines keep their state)`
        : `When a ticket enters phase ${text({ value: input.phaseId })}, move its lines of item ` +
          `type ${text({ value: input.entityTypeId })} to state ${text({ value: input.stateId })}`,
  }),
  mcpTool({
    operation: "phaseGrid.importTemplate",
    idempotent: true,
    summary: ({ input }) =>
      `Fill empty phase grid cells from template ${text({ value: input.template })}`,
  }),
];
