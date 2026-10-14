import { mcpTool, text } from "../../tools/meta";

export const configurationMcpTools = [
  mcpTool({
    operation: "configuration.importTemplate",
    idempotent: true,
    summary: ({ input }) => `Import configuration template ${text({ value: input.template })}`,
  }),
];
