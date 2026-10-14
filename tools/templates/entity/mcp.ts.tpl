import { mcpTool, text } from "../../tools/meta";

// MCP metadata for {{Pascal}} (ADR 0003, 0007). The tools themselves are generated from the core operations
// (name, description, input/output schemas); only MCP-specific settings per operation are declared here.
// Descriptions are written in core (`description`) – they are read by the AI assistant.
// Commands are never executed directly by the AI actor: `summary` is the text on the approval card.
// Remember: add {{camel}}McpTools to apps/mcp/src/tools/meta-registry.ts.
export const {{camel}}McpTools = [
  mcpTool({ operation: "{{kebab}}.list" }),
  mcpTool({ operation: "{{kebab}}.get" }),
  mcpTool({
    operation: "{{kebab}}.create",
    summary: ({ input }) => `Create {{kebab}} "${text({ value: input.name })}"`, // TODO: choose a field
  }),
  mcpTool({
    operation: "{{kebab}}.update",
    idempotent: true,
    summary: ({ input }) => `Update {{kebab}} ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "{{kebab}}.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive {{kebab}} ${text({ value: input.id })}`,
  }),
];
