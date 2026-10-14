import { defineOperation } from "@okazi/core"; // TODO: confirm the export name and signature in packages/core
import {
  create{{Pascal}}InputSchema,
  get{{Pascal}}InputSchema,
  list{{Pascal}}InputSchema,
  {{camel}}Schema,
} from "./schema";

// Core operations for {{Pascal}}. The single source of truth: web, GraphQL, REST and MCP call these (ADR 0003).
// TODO: kind, permission and ctx fields (organizationId, actorId) per the core API.
// Mutations are written to AuditLog by the core hook (ADR 0006).

export const create{{Pascal}} = defineOperation({
  name: "{{kebab}}.create",
  description: "TODO: description for the AI assistant and the API documentation.",
  kind: "mutation",
  input: create{{Pascal}}InputSchema,
  output: {{camel}}Schema,
  permission: "{{kebab}}:create",
  async handler({ input, ctx }) {
    // TODO: create the row via ctx.db (org-scoped) and return a Result with an ok value.
    throw new Error(`TODO: implement {{kebab}}.create (${input.name}, org ${ctx.organizationId})`);
  },
});

export const get{{Pascal}} = defineOperation({
  name: "{{kebab}}.get",
  description: "TODO: fetch a {{Pascal}} by id in the active organization.",
  kind: "query",
  input: get{{Pascal}}InputSchema,
  output: {{camel}}Schema.nullable(),
  permission: "{{kebab}}:read",
  async handler({ input, ctx }) {
    // TODO: read the row via ctx.db (org-scoped, status != ARCHIVED) and return a Result.
    throw new Error(`TODO: implement {{kebab}}.get (${input.id}, org ${ctx.organizationId})`);
  },
});

export const list{{Pascal}} = defineOperation({
  name: "{{kebab}}.list",
  description: "TODO: list {{Pascal}} in the active organization.",
  kind: "query",
  input: list{{Pascal}}InputSchema,
  output: {{camel}}Schema.array(),
  permission: "{{kebab}}:read",
  async handler({ input, ctx }) {
    // TODO: read rows via ctx.db with input.limit and return a Result.
    throw new Error(`TODO: implement {{kebab}}.list (${input.limit}, org ${ctx.organizationId})`);
  },
});
