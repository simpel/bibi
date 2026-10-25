import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";

type Context = Pick<OperationContext, "db" | "organizationId">;

export type CheckStaffItemsInput = {
  context: Context;
  itemIds: readonly string[];
  profileId: string | null;
};

type StaffItemRow = { name: string; entityType: { resourceKind: string | null } };

/** The issue for one requested id: unknown or archived, or not of a PERSON type. */
function staffIssue({ item, index }: { item: StaffItemRow | undefined; index: number }) {
  const path = `itemIds.${index}`;
  if (!item) return [{ path, message: "Item not found" }];
  if (item.entityType.resourceKind === "PERSON") return [];
  return [{ path, message: `"${item.name}" is not a staff item (its type is not PERSON)` }];
}

/**
 * Every id is an active item of this organization whose type is PERSON (`VALIDATION` on
 * `itemIds.<i>`), and none is linked to another member (`CONFLICT`, ADR 0068 rule 2). A link
 * written by a concurrent call hits the unique key on the item and is a `CONFLICT` too.
 */
export async function checkStaffItems({
  context,
  itemIds,
  profileId,
}: CheckStaffItemsInput): Promise<Result<true>> {
  const items = await context.db.item.findMany({
    where: { id: { in: [...itemIds] } },
    select: { id: true, name: true, entityType: { select: { resourceKind: true } } },
  });
  const byId = new Map(items.map((item) => [item.id, item]));
  const issues = itemIds.flatMap((id, index) => staffIssue({ item: byId.get(id), index }));
  if (issues.length > 0)
    return invalid({ message: "Only active staff items can be linked", issues });
  const taken = await context.db.memberProfileItem.findMany({
    where: {
      itemId: { in: [...itemIds] },
      ...(profileId ? { memberProfileId: { not: profileId } } : {}),
    },
    select: { itemId: true },
  });
  if (taken.length === 0) return ok({ value: true });
  const names = taken.map(({ itemId }) => `"${byId.get(itemId)?.name ?? itemId}"`).join(", ");
  return conflict({
    message: `Already linked to another member: ${names}`,
    issues: taken.map(({ itemId }) => ({
      path: `itemIds.${itemIds.indexOf(itemId)}`,
      message: "Linked to another member",
    })),
  });
}

export type ReplaceLinksInput = { context: Context; profileId: string; itemIds: readonly string[] };

/** Replaces the profile's links to active items; links of archived items are kept (hidden). */
export async function replaceLinks({ context, profileId, itemIds }: ReplaceLinksInput) {
  await context.db.memberProfileItem.deleteMany({
    where: {
      memberProfileId: profileId,
      itemId: { notIn: [...itemIds] },
      item: { status: "ACTIVE" },
    },
  });
  const kept = await context.db.memberProfileItem.findMany({
    where: { memberProfileId: profileId },
    select: { itemId: true },
  });
  const have = new Set(kept.map(({ itemId }) => itemId));
  const added = itemIds.filter((itemId) => !have.has(itemId));
  if (added.length === 0) return;
  await context.db.memberProfileItem.createMany({
    data: added.map((itemId) => ({
      organizationId: context.organizationId,
      memberProfileId: profileId,
      itemId,
    })),
  });
}
