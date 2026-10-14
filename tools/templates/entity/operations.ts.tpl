import { defineOperation } from "@okazi/core"; // TODO: bekräfta exportnamn och signatur i packages/core
import {
  create{{Pascal}}InputSchema,
  get{{Pascal}}InputSchema,
  list{{Pascal}}InputSchema,
  {{camel}}Schema,
} from "./schema";

// Core-operationer för {{Pascal}}. Enda sanningen: web, GraphQL, REST och MCP anropar dessa (ADR 0003).
// TODO: kind, permission och ctx-fält (organizationId, actorId) enligt core-API:t.
// Mutationer loggas i AuditLog av core-hooken (ADR 0006).

export const create{{Pascal}} = defineOperation({
  name: "{{kebab}}.create",
  description: "TODO: beskrivning för AI-assistenten och API-dokumentationen.",
  kind: "mutation",
  input: create{{Pascal}}InputSchema,
  output: {{camel}}Schema,
  permission: "{{kebab}}:create",
  async handler({ input, ctx }) {
    // TODO: skapa raden via ctx.db (org-scopad) och returnera ett Result med ok-värde.
    throw new Error(`TODO: implementera {{kebab}}.create (${input.name}, org ${ctx.organizationId})`);
  },
});

export const get{{Pascal}} = defineOperation({
  name: "{{kebab}}.get",
  description: "TODO: hämta en {{Pascal}} med id i aktiv organisation.",
  kind: "query",
  input: get{{Pascal}}InputSchema,
  output: {{camel}}Schema.nullable(),
  permission: "{{kebab}}:read",
  async handler({ input, ctx }) {
    // TODO: läs raden via ctx.db (org-scopad, status != ARCHIVED) och returnera Result.
    throw new Error(`TODO: implementera {{kebab}}.get (${input.id}, org ${ctx.organizationId})`);
  },
});

export const list{{Pascal}} = defineOperation({
  name: "{{kebab}}.list",
  description: "TODO: lista {{Pascal}} i aktiv organisation.",
  kind: "query",
  input: list{{Pascal}}InputSchema,
  output: {{camel}}Schema.array(),
  permission: "{{kebab}}:read",
  async handler({ input, ctx }) {
    // TODO: läs rader via ctx.db med input.limit och returnera Result.
    throw new Error(`TODO: implementera {{kebab}}.list (${input.limit}, org ${ctx.organizationId})`);
  },
});
