import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { CONFERENCE_BANQUET_KINDS } from "./kind-template";
import {
  type FloorElementKindCreateInput,
  FloorElementKindCreateInputSchema,
  type FloorElementKindDto,
  FloorElementKindIdInputSchema,
  FloorElementKindImportInputSchema,
  FloorElementKindImportOutputSchema,
  FloorElementKindListInputSchema,
  FloorElementKindListOutputSchema,
  FloorElementKindSchema,
  FloorElementKindUpdateInputSchema,
} from "./schema";

type InsertKindInput = { context: OperationContext } & FloorElementKindCreateInput;

/** Shared by `floorElementKind.create` and the template import: unique name, insert, record. */
async function insertKind({
  context,
  ...input
}: InsertKindInput): Promise<Result<FloorElementKindDto>> {
  if (await context.db.floorElementKind.findFirst({ where: { name: input.name } })) {
    return conflict({ message: `A kind named "${input.name}" exists` });
  }
  const kind = await context.db.floorElementKind.create({
    data: { ...input, organizationId: context.organizationId },
  });
  context.recordChange({ entityId: kind.id, after: kind });
  return ok({ value: kind });
}

export const listFloorElementKinds = defineOperation({
  name: "floorElementKind.list",
  kind: "query",
  description:
    "List the organization's furniture library for floor plans and setup layouts (tables, rows " +
    "of chairs, stages; fixed kinds such as doors belong to the floor plan), by name.",
  input: FloorElementKindListInputSchema,
  output: FloorElementKindListOutputSchema,
  permission: "configuration:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.floorElementKind.findMany({
      orderBy: [{ fixed: "asc" }, { name: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getFloorElementKind = defineOperation({
  name: "floorElementKind.get",
  kind: "query",
  description: "Get one furniture kind by id.",
  input: FloorElementKindIdInputSchema,
  output: FloorElementKindSchema,
  permission: "configuration:read",
  handler: async ({ input, context }) => {
    const kind = await context.db.floorElementKind.findFirst({ where: { id: input.id } });
    return kind ? ok({ value: kind }) : notFound({ entity: "Floor element kind" });
  },
});

export const createFloorElementKind = defineOperation({
  name: "floorElementKind.create",
  kind: "command",
  description:
    "Create a furniture kind with its default size and chairs (per side for RECT, around for " +
    "ROUND, in the row for SEAT_ROW). Names are unique.",
  input: FloorElementKindCreateInputSchema,
  output: FloorElementKindSchema,
  permission: "configuration:write",
  handler: ({ input, context }) => insertKind({ context, ...input }),
});

export const updateFloorElementKind = defineOperation({
  name: "floorElementKind.update",
  kind: "command",
  description:
    "Rename a furniture kind or change its default size, chairs or keep-clear area. Pieces that " +
    "inherit change with it; pieces with their own values keep them.",
  input: FloorElementKindUpdateInputSchema,
  output: FloorElementKindSchema,
  permission: "configuration:write",
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await context.db.floorElementKind.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Floor element kind" });
    if (data.name && data.name !== before.name) {
      const taken = await context.db.floorElementKind.findFirst({ where: { name: data.name } });
      if (taken) return conflict({ message: `A kind named "${data.name}" exists` });
    }
    const kind = await context.db.floorElementKind.update({ where: { id }, data });
    context.recordChange({ entityId: id, before, after: kind });
    return ok({ value: kind });
  },
});

export const archiveFloorElementKind = defineOperation({
  name: "floorElementKind.archive",
  kind: "command",
  description: "Archive a furniture kind. Refused while a floor plan or layout uses it.",
  input: FloorElementKindIdInputSchema,
  output: FloorElementKindSchema,
  permission: "configuration:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.floorElementKind.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Floor element kind" });
    const used = await context.db.floorElement.count({ where: { kindId: id } });
    if (used > 0) return conflict({ message: `${used} placed pieces use this kind` });
    const kind = await context.db.floorElementKind.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({ entityId: id, before, after: kind });
    return ok({ value: kind });
  },
});

export const importFloorElementKinds = defineOperation({
  name: "floorElementKind.importTemplate",
  kind: "command",
  description:
    "Import a starter furniture library (round and long tables, rows of chairs, stage, buffet, " +
    "dance floor, door, pillar, screen). Names that exist are skipped.",
  input: FloorElementKindImportInputSchema,
  output: FloorElementKindImportOutputSchema,
  permission: "configuration:write",
  handler: async ({ context }) => {
    const existing = await context.db.floorElementKind.findMany({ select: { name: true } });
    const names = new Set(existing.map((kind) => kind.name));
    const missing = CONFERENCE_BANQUET_KINDS.filter((kind) => !names.has(kind.name));
    for (const kind of missing) {
      const result = await insertKind({ context, ...kind });
      if (!result.ok) return result;
    }
    return ok({
      value: { created: missing.length, skipped: CONFERENCE_BANQUET_KINDS.length - missing.length },
    });
  },
});

export const floorElementKindOperations = [
  listFloorElementKinds,
  getFloorElementKind,
  createFloorElementKind,
  updateFloorElementKind,
  archiveFloorElementKind,
  importFloorElementKinds,
];
