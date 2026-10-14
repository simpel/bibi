import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { toEntityTypeDto, toEntityTypeDtos } from "./load-entity-type";
import {
  EntityTypeIdInputSchema,
  EntityTypeListInputSchema,
  EntityTypeListOutputSchema,
  EntityTypeSchema,
} from "./schema";

export const listEntityTypes = defineOperation({
  name: "entityType.list",
  kind: "query",
  description:
    "List the organization's own types (e.g. Konferensrum, Rätt, Båt for items; Företag for " +
    "customers) with their behaviours and fields. Read this to know which fields an item has.",
  input: EntityTypeListInputSchema,
  output: EntityTypeListOutputSchema,
  permission: "configuration:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.entityType.findMany({
      where: input.base ? { base: input.base } : {},
      orderBy: [{ base: "asc" }, { name: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = await toEntityTypeDtos({ context, rows: page.items });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getEntityType = defineOperation({
  name: "entityType.get",
  kind: "query",
  description: "Get one type by id, with its behaviours and fields.",
  input: EntityTypeIdInputSchema,
  output: EntityTypeSchema,
  permission: "configuration:read",
  handler: async ({ input, context }) => {
    const row = await context.db.entityType.findFirst({ where: { id: input.id } });
    return row ? ok({ value: await toEntityTypeDto({ context, row }) }) : notFound({ entity: "Type" });
  },
});
