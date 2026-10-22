import type { Prisma } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import type { PoolFreeUnits, PoolFreeUnitsInput } from "./pool-schema";
import { poolTagFilter } from "./pool-tags";

const problem = ({ path, message }: { path: string; message: string }) =>
  invalid({ message, issues: [{ path, message }] });

type FreeInput = Pick<PoolFreeUnitsInput, "startsAt" | "endsAt">;

/** A unit is taken by a hard hold or buffer, or a manual block, that overlaps the window. */
export const takenIn = ({ startsAt, endsAt }: FreeInput): Prisma.OccupancyWhereInput => ({
  status: "ACTIVE",
  startsAt: { lt: endsAt },
  endsAt: { gt: startsAt },
  OR: [{ holdKind: null }, { holdKind: { not: "SOFT" } }],
});

/** A target as `PoolTargetShape` gives it: one item, or a type with its tags. */
export type PoolTarget = {
  itemId?: string | null | undefined;
  entityTypeId?: string | null | undefined;
  tagValueIds: readonly string[];
};

export type PoolUnitsWhereInput = { context: Pick<OperationContext, "db">; input: PoolTarget };

type TargetInput = { context: OperationContext; input: PoolFreeUnitsInput };

/**
 * The units the target names, before availability: one bookable catalog item, or the active
 * catalog items of a bookable item type that carry every tag. Also checks the target.
 */
export async function poolUnitsWhere({
  context,
  input,
}: PoolUnitsWhereInput): Promise<Result<Prisma.ItemWhereInput>> {
  const { itemId, entityTypeId, tagValueIds } = input;
  if (Boolean(itemId) === Boolean(entityTypeId)) {
    return problem({ path: "itemId", message: "Give either itemId or entityTypeId" });
  }
  if (itemId) {
    if (tagValueIds.length) {
      return problem({ path: "tagValueIds", message: "Tags only apply to a pool" });
    }
    const item = await context.db.item.findFirst({
      where: { id: itemId, customerId: null, status: "ACTIVE" },
      select: { id: true, entityType: { select: { capabilities: true } } },
    });
    if (!item) return notFound({ entity: "Item" });
    if (!item.entityType.capabilities.includes("BOOKABLE")) {
      return problem({ path: "itemId", message: "The item is not bookable" });
    }
    return ok({ value: { id: item.id } });
  }
  const type = await context.db.entityType.findFirst({
    where: { id: entityTypeId as string, base: "ITEM", status: "ACTIVE" },
    select: { id: true, capabilities: true },
  });
  if (!type) return notFound({ entity: "Item type" });
  if (!type.capabilities.includes("BOOKABLE")) {
    return problem({ path: "entityTypeId", message: "A pool needs a bookable item type" });
  }
  const tags = await poolTagFilter({
    context,
    entityTypeId: type.id,
    tagValueIds,
  });
  if (!tags.ok) return tags;
  return ok({
    value: { entityTypeId: type.id, customerId: null, status: "ACTIVE", AND: tags.value },
  });
}

/**
 * The free units of a target for a window, in pool order (name, then id). The first one is the
 * prepick; it only depends on the data, so it is stable between calls. Derived on read, nothing is
 * stored (ADR 0051).
 */
export async function poolFreeUnits({
  context,
  input,
}: TargetInput): Promise<Result<PoolFreeUnits>> {
  const base = await poolUnitsWhere({ context, input });
  if (!base.ok) return base;
  if (input.endsAt <= input.startsAt) {
    return problem({ path: "endsAt", message: "The window must end after it starts" });
  }
  const where: Prisma.ItemWhereInput = {
    ...base.value,
    occupancies: { none: takenIn(input) },
  };
  const select = { id: true, name: true, entityTypeId: true } as const;
  const orderBy = [{ name: "asc" }, { id: "asc" }] as const;
  const rows = await context.db.item.findMany({
    where,
    select,
    orderBy: [...orderBy],
    ...pageArgs(input),
  });
  const page = paginate({ rows, limit: input.limit });
  const first = input.cursor
    ? await context.db.item.findFirst({ where, select: { id: true }, orderBy: [...orderBy] })
    : null;
  const prepickId = first?.id ?? page.items[0]?.id ?? null;
  return ok({ value: { ...page, prepickId } });
}
