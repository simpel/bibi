import { mcpTool, text } from "../../tools/meta";

export const alternativeGroupMcpTools = [
  mcpTool({ operation: "alternativeGroup.list" }),
  mcpTool({ operation: "alternativeGroup.get" }),
  mcpTool({
    operation: "alternativeGroup.create",
    summary: ({ input }) =>
      `Make ${Array.isArray(input.lineIds) ? input.lineIds.length : 0} lines of ticket ` +
      `${text({ value: input.ticketId })} alternatives ` +
      `"${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "alternativeGroup.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update alternative group ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "alternativeGroup.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) =>
      `Dissolve alternative group ${text({ value: input.id })}; its options become ordinary lines`,
  }),
  mcpTool({
    operation: "alternativeGroup.choose",
    summary: ({ input }) =>
      `Choose line ${text({ value: input.lineId })} in alternative group ` +
      `${text({ value: input.id })} and release the other options`,
  }),
];
