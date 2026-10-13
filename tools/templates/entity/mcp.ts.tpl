import { mcpTool, text } from "../../tools/meta";

// MCP-metadata för {{Pascal}} (ADR 0003, 0007). Själva verktygen genereras från core-operationerna
// (namn, beskrivning, in-/utdata-scheman); här deklareras bara MCP-specifikt per operation.
// Beskrivningar skrivs i core (`description`) – de läses av AI-assistenten.
// Kommandon utförs aldrig direkt av AI-aktören: `summary` är texten på godkännandekortet.
// Kom ihåg: lägg till {{camel}}McpTools i apps/mcp/src/tools/meta-registry.ts.
export const {{camel}}McpTools = [
  mcpTool({ operation: "{{kebab}}.list" }),
  mcpTool({ operation: "{{kebab}}.get" }),
  mcpTool({
    operation: "{{kebab}}.create",
    summary: ({ input }) => `Create {{kebab}} "${text({ value: input.name })}"`, // TODO: välj fält
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
