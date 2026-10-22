import { mcpTool, text } from "../../tools/meta";

export const itemDemandMcpTools = [
  mcpTool({ operation: "itemDemand.list" }),
  mcpTool({ operation: "itemDemand.get" }),
  mcpTool({
    operation: "itemDemand.create",
    summary: ({ input }) =>
      `Item ${text({ value: input.itemId })} needs ${text({ value: input.quantity ?? 1 })} of ` +
      `${text({ value: input.entityTypeId ?? input.targetItemId })} for ` +
      (Array.isArray(input.windows)
        ? input.windows.map((value: unknown) => text({ value })).join(", ")
        : ""),
  }),
  mcpTool({
    operation: "itemDemand.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update demand ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "itemDemand.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Remove demand ${text({ value: input.id })}`,
  }),
];
