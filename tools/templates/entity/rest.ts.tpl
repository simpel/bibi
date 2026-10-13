import { restRoute } from "../../rest-route";

// REST-rutter för {{Pascal}} under /api/v1 (ADR 0003). Varje rutt pekar på en core-operation.
// OpenAPI genereras från operationens Zod-schema. Ingen affärslogik här.
// Registrera {{camel}}Routes i packages/api/src/routes.ts. Plural i sökvägar är ett förslag.
export const {{camel}}Routes = [
  restRoute({ operation: "{{kebab}}.list", method: "GET", path: "/{{kebab}}s" }),
  restRoute({ operation: "{{kebab}}.get", method: "GET", path: "/{{kebab}}s/{id}" }),
  restRoute({ operation: "{{kebab}}.create", method: "POST", path: "/{{kebab}}s" }),
  restRoute({ operation: "{{kebab}}.update", method: "PATCH", path: "/{{kebab}}s/{id}" }),
  restRoute({ operation: "{{kebab}}.archive", method: "DELETE", path: "/{{kebab}}s/{id}" }),
];
