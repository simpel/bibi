// REST-rutter för {{Pascal}} under /api/v1 (ADR 0003). Varje rutt pekar på en core-operation.
// OpenAPI genereras från operationens Zod-schema. Ingen affärslogik här.
// TODO: registrera rutterna i packages/api enligt befintligt mönster. Plural i sökvägar är ett förslag.
export const {{camel}}Routes = [
  { method: "GET", path: "/{{kebab}}s/:id", operation: "{{kebab}}.get" },
  { method: "GET", path: "/{{kebab}}s", operation: "{{kebab}}.list" },
  { method: "POST", path: "/{{kebab}}s", operation: "{{kebab}}.create" },
] as const;
