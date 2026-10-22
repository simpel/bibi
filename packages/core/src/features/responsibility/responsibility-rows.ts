import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { ResponsibilityContents, ResponsibilityDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

const byPosition = { orderBy: { position: "asc" } } as const;

/** The join rows (ADR 0056) a responsibility's id lists are read from, in the given order. */
export const RESPONSIBILITY_INCLUDE = {
  entityTypes: { select: { entityTypeId: true }, ...byPosition },
  defaultFollowers: { select: { userId: true }, ...byPosition },
} satisfies Prisma.ResponsibilityInclude;

export type ResponsibilityRow = Prisma.ResponsibilityGetPayload<{
  include: typeof RESPONSIBILITY_INCLUDE;
}>;

/** The API shape: the join rows as id lists. */
export function toResponsibilityDto({ row }: { row: ResponsibilityRow }): ResponsibilityDto {
  const { entityTypes, defaultFollowers, ...rest } = row;
  return {
    ...rest,
    entityTypeIds: entityTypes.map((link) => link.entityTypeId),
    defaultFollowerIds: defaultFollowers.map((link) => link.userId),
  };
}

export type FindResponsibilityInput = Db & { id: string };

/** One responsibility of the organization with its id lists, or null. */
export async function findResponsibility({
  context,
  id,
}: FindResponsibilityInput): Promise<ResponsibilityDto | null> {
  const row = await context.db.responsibility.findFirst({
    where: { id },
    include: RESPONSIBILITY_INCLUDE,
  });
  return row ? toResponsibilityDto({ row }) : null;
}

export type ReplaceResponsibilityLinksInput = {
  context: OperationContext;
  responsibilityId: string;
  contents: ResponsibilityContents;
};

/** Replaces the covered types and default followers. Audit has the responsibility. */
export async function replaceResponsibilityLinks({
  context,
  responsibilityId,
  contents,
}: ReplaceResponsibilityLinksInput) {
  const { organizationId } = context;
  const where = { responsibilityId };
  await context.db.responsibilityEntityType.deleteMany({ where });
  await context.db.responsibilityDefaultFollower.deleteMany({ where });
  await context.db.responsibilityEntityType.createMany({
    data: contents.entityTypeIds.map((entityTypeId, position) => ({
      ...where,
      entityTypeId,
      position,
      organizationId,
    })),
  });
  await context.db.responsibilityDefaultFollower.createMany({
    data: contents.defaultFollowerIds.map((userId, position) => ({
      ...where,
      userId,
      position,
      organizationId,
    })),
  });
}
