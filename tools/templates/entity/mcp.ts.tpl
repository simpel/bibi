import { mcpTool, text } from "../../tools/meta";

// MCP metadata for {{Pascal}} (ADR 0003, 0007). The tools themselves are generated from the core operations
// (name, description, input/output schemas); only MCP-specific settings per operation are declared here.
// Descriptions are written in core (`description`) – they are read by the AI assistant.
// Commands are never executed directly by the AI actor: `summary` is the text on the approval card.
// Remember: add {{camel}}McpTools to apps/mcp/src/tools/meta-registry.ts.
export const {{camel}}McpTools = [
  mcpTool({ operation: "{{camel}}.list" }),
  mcpTool({ operation: "{{camel}}.get" }),
  mcpTool({
    operation: "{{camel}}.create",
    summary: ({ input }) => `Create {{camel}} "${text({ value: input.name })}"`, // TODO: choose a field
  }),
  mcpTool({
    operation: "{{camel}}.update",
    idempotent: true,
    summary: ({ input }) => `Update {{camel}} ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "{{camel}}.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive {{camel}} ${text({ value: input.id })}`,
  }),
];
