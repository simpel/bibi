import type { z } from "zod";
import { ok, type Result } from "../../errors/result";
import type { HandlerInput, OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import type {
  ItemTypeGroupDto,
  ItemTypeGroupIdInputSchema,
  ItemTypeGroupListInputSchema,
  ItemTypeGroupReorderInputSchema,
  ItemTypeGroupUpdateInputSchema,
} from "./schema";

type Db = Pick<OperationContext, "db">;

const ORDER = [{ position: "asc" as const }, { id: "asc" as const }];

const nameTaken = ({ name }: { name: string }) =>
  conflict({ message: `A group named "${name}" exists` });

/** Case-insensitive, so "Food" and "food" are one group. */
async function findByName({ context, name }: { context: Db; name: string }) {
  return context.db.itemTypeGroup.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
}

export type InsertItemTypeGroupInput = { context: OperationContext; name: string };

/** Shared by `itemTypeGroup.create` and the welcome setup: placed last, names unique. */
export async function insertItemTypeGroup({
  context,
  name,
}: InsertItemTypeGroupInput): Promise<Result<ItemTypeGroupDto>> {
  if (await findByName({ context, name })) return nameTaken({ name });
  const last = await context.db.itemTypeGroup.findFirst({ orderBy: { position: "desc" } });
  const group = await context.db.itemTypeGroup.create({
    data: { organizationId: context.organizationId, name, position: last ? last.position + 1 : 0 },
  });
  context.recordChange({ entityId: group.id, after: group });
  return ok({ value: group });
}

export const listItemTypeGroupsHandler = async ({
  input,
  context,
}: HandlerInput<z.infer<typeof ItemTypeGroupListInputSchema>>) => {
  const rows = await context.db.itemTypeGroup.findMany({ orderBy: ORDER, ...pageArgs(input) });
  return ok({ value: paginate({ rows, limit: input.limit }) });
};

export const getItemTypeGroupHandler = async ({
  input,
  context,
}: HandlerInput<z.infer<typeof ItemTypeGroupIdInputSchema>>) => {
  const group = await context.db.itemTypeGroup.findFirst({ where: { id: input.id } });
  return group ? ok({ value: group }) : notFound({ entity: "Item type group" });
};

export const updateItemTypeGroupHandler = async ({
  input: { id, name },
  context,
}: HandlerInput<z.infer<typeof ItemTypeGroupUpdateInputSchema>>) => {
  const before = await context.db.itemTypeGroup.findFirst({ where: { id } });
  if (!before) return notFound({ entity: "Item type group" });
  if (name !== undefined && name !== before.name) {
    const other = await findByName({ context, name });
    if (other && other.id !== id) return nameTaken({ name });
  }
  const after = await context.db.itemTypeGroup.update({ where: { id }, data: { name } });
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
};

export const reorderItemTypeGroupsHandler = async ({
  input: { ids },
  context,
}: HandlerInput<z.infer<typeof ItemTypeGroupReorderInputSchema>>) => {
  const current = await context.db.itemTypeGroup.findMany({ orderBy: ORDER });
  const known = new Set(current.map((group) => group.id));
  const complete = ids.length === current.length && new Set(ids).size === ids.length;
  if (!complete || ids.some((id) => !known.has(id))) {
    const message = "List every active group exactly once";
    return invalid({ message, issues: [{ path: "ids", message }] });
  }
  for (const [position, id] of ids.entries()) {
    const before = current.find((group) => group.id === id);
    if (!before || before.position === position) continue;
    await context.db.itemTypeGroup.update({ where: { id }, data: { position } });
    context.recordChange({ entityId: id, before, after: { ...before, position } });
  }
  const items = await context.db.itemTypeGroup.findMany({ orderBy: ORDER });
  return ok({ value: { items, nextCursor: null } });
};

/** Archiving a group leaves its types ungrouped (ADR 0101); types and items are unchanged. */
export const archiveItemTypeGroupHandler = async ({
  input: { id },
  context,
}: HandlerInput<z.infer<typeof ItemTypeGroupIdInputSchema>>) => {
  const before = await context.db.itemTypeGroup.findFirst({ where: { id } });
  if (!before) return notFound({ entity: "Item type group" });
  const types = await context.db.entityType.findMany({
    where: { groupId: id, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });
  for (const type of types) {
    await context.db.entityType.update({ where: { id: type.id }, data: { groupId: null } });
    context.recordChange({ entityId: type.id, before: type, after: { ...type, groupId: null } });
  }
  const after = await context.db.itemTypeGroup.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
};
