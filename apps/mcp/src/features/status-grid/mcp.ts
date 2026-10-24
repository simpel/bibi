import { mcpTool, text } from "../../tools/meta";

export const statusGridMcpTools = [
  mcpTool({ operation: "statusGrid.get" }),
  mcpTool({
    operation: "statusGrid.setCell",
    idempotent: true,
    summary: ({ input }) =>
      input.stateId === null
        ? `Clear the grid cell of status ${text({ value: input.statusId })} and item type ` +
          `${text({ value: input.entityTypeId })} (lines keep their state)`
        : `When a ticket enters status ${text({ value: input.statusId })}, move its lines of item ` +
          `type ${text({ value: input.entityTypeId })} to state ${text({ value: input.stateId })}`,
  }),
  mcpTool({
    operation: "statusGrid.importTemplate",
    idempotent: true,
    summary: ({ input }) =>
      `Fill empty status grid cells from template ${text({ value: input.template })}`,
  }),
];
