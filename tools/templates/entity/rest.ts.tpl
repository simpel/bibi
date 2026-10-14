import { restRoute } from "../../rest-route";

// REST routes for {{Pascal}} under /api/v1 (ADR 0003). Each route points to a core operation.
// OpenAPI is generated from the operation's Zod schema. No business logic here.
// Register {{camel}}Routes in packages/api/src/routes.ts. The plural in paths is a suggestion.
export const {{camel}}Routes = [
  restRoute({ operation: "{{kebab}}.list", method: "GET", path: "/{{kebab}}s" }),
  restRoute({ operation: "{{kebab}}.get", method: "GET", path: "/{{kebab}}s/{id}" }),
  restRoute({ operation: "{{kebab}}.create", method: "POST", path: "/{{kebab}}s" }),
  restRoute({ operation: "{{kebab}}.update", method: "PATCH", path: "/{{kebab}}s/{id}" }),
  restRoute({ operation: "{{kebab}}.archive", method: "DELETE", path: "/{{kebab}}s/{id}" }),
];
