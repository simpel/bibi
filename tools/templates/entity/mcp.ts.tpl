// MCP-verktyg för {{Pascal}} (ADR 0003, 0007). Verktygen kör core-operationerna som inloggad användare.
// Beskrivningarna läses av AI-assistenten: skriv dem så att en modell förstår när verktyget används.
// TODO: inputSchema hämtas från operationen när MCP-registreringen i apps/mcp är klar.
export const {{camel}}McpTools = [
  {
    name: "{{snake}}_get",
    description: "TODO: hämta en {{Pascal}} med id.",
    operation: "{{kebab}}.get",
  },
  {
    name: "{{snake}}_list",
    description: "TODO: lista {{Pascal}} i aktiv organisation.",
    operation: "{{kebab}}.list",
  },
  {
    name: "{{snake}}_create",
    description: "TODO: skapa en {{Pascal}}. Mutationer kräver användarens godkännande (ADR 0007).",
    operation: "{{kebab}}.create",
  },
] as const;
