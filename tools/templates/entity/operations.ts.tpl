import { AppError } from "../../errors/app-error";
import { err } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { {{camel}}Embeddable } from "./embeddable";
import {
  {{Pascal}}CreateInputSchema,
  {{Pascal}}IdInputSchema,
  {{Pascal}}ListInputSchema,
  {{Pascal}}ListOutputSchema,
  {{Pascal}}Schema,
  {{Pascal}}UpdateInputSchema,
} from "./schema";

// Core operations for {{Pascal}}. The single source of truth: web, GraphQL, REST and MCP call these (ADR 0003).
// Handlers receive `{ input, context }`. Read and write through `context.db` (org-scoped) and return a `Result`
// (`ok({ value })`, or `notFound`/`conflict` from ../../shared/errors). Never throw.
// Commands record their change with `context.recordChange({ entityId, before, after })` (AuditLog, ADR 0006).
// Model: copy features/setup/operations.ts. Use an existing feature or add "{{camel}}" to FEATURE_SPECS in permissions/features.ts (ADR 0050).

const todo = async ({ operation }: { operation: string }) =>
  err({ error: new AppError({ code: "INTERNAL", message: `TODO: implement ${operation}` }) });

export const list{{Pascal}}s = defineOperation({
  name: "{{camel}}.list",
  kind: "query",
  description: "TODO: list the organization's {{Pascal}} rows, ordered by name.",
  input: {{Pascal}}ListInputSchema,
  output: {{Pascal}}ListOutputSchema,
  permission: "{{camel}}:read",
  // TODO: context.db.{{camel}}.findMany({ orderBy, ...pageArgs(input) }) and paginate({ rows, limit }).
  handler: () => todo({ operation: "{{camel}}.list" }),
});

export const get{{Pascal}} = defineOperation({
  name: "{{camel}}.get",
  kind: "query",
  description: "TODO: get one {{Pascal}} by id.",
  input: {{Pascal}}IdInputSchema,
  output: {{Pascal}}Schema,
  permission: "{{camel}}:read",
  // TODO: context.db.{{camel}}.findFirst({ where: { id } }), notFound({ entity: "{{Pascal}}" }) when missing.
  handler: () => todo({ operation: "{{camel}}.get" }),
});

export const create{{Pascal}} = defineOperation({
  name: "{{camel}}.create",
  kind: "command",
  description: "TODO: create a {{Pascal}}.",
  input: {{Pascal}}CreateInputSchema,
  output: {{Pascal}}Schema,
  permission: "{{camel}}:write",
  embeddable: {{camel}}Embeddable,
  // TODO: context.db.{{camel}}.create({ data: { ...input, organizationId: context.organizationId } }) and recordChange.
  handler: () => todo({ operation: "{{camel}}.create" }),
});

export const update{{Pascal}} = defineOperation({
  name: "{{camel}}.update",
  kind: "command",
  description: "TODO: update fields of a {{Pascal}}. Omitted fields are unchanged.",
  input: {{Pascal}}UpdateInputSchema,
  output: {{Pascal}}Schema,
  permission: "{{camel}}:write",
  embeddable: {{camel}}Embeddable,
  // TODO: load `before`, update, context.recordChange({ entityId, before, after }).
  handler: () => todo({ operation: "{{camel}}.update" }),
});

export const archive{{Pascal}} = defineOperation({
  name: "{{camel}}.archive",
  kind: "command",
  description: "TODO: archive (soft-delete) a {{Pascal}}.",
  input: {{Pascal}}IdInputSchema,
  output: {{Pascal}}Schema,
  permission: "{{camel}}:delete",
  embeddable: {{camel}}Embeddable,
  // TODO: set status ARCHIVED, context.recordChange({ entityId, before, after }).
  handler: () => todo({ operation: "{{camel}}.archive" }),
});

export const {{camel}}Operations = [
  list{{Pascal}}s,
  get{{Pascal}},
  create{{Pascal}},
  update{{Pascal}},
  archive{{Pascal}},
];
