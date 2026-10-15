import { mcpTool, text } from "../../tools/meta";

export const priceListMcpTools = [
  mcpTool({ operation: "priceList.list" }),
  mcpTool({ operation: "priceList.get" }),
  mcpTool({
    operation: "priceList.create",
    summary: ({ input }) => `Create price list "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "priceList.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update price list ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "priceList.setItems",
    idempotent: true,
    summary: ({ input }) =>
      `Set ${Array.isArray(input.items) ? input.items.length : 0} item prices on price list ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "priceList.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive price list ${text({ value: input.id })}`,
  }),
];
