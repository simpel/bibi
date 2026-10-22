import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { ItemDemandDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** The demand row with its tags, ordered by value id. */
export const DEMAND_INCLUDE = {
  tags: { select: { valueId: true }, orderBy: { valueId: "asc" } },
} as const satisfies Prisma.ItemDemandInclude;

type DemandRow = Prisma.ItemDemandGetPayload<{ include: typeof DEMAND_INCLUDE }>;

export const toDemandDto = ({ row: { tags, ...row } }: { row: DemandRow }): ItemDemandDto => ({
  ...row,
  tagValueIds: tags.map((tag) => tag.valueId),
});

export type LoadDemandInput = Db & { id: string };

/** One active demand of the organization, or null. */
export async function loadDemand({ context, id }: LoadDemandInput): Promise<ItemDemandDto | null> {
  const row = await context.db.itemDemand.findFirst({ where: { id }, include: DEMAND_INCLUDE });
  return row ? toDemandDto({ row }) : null;
}

export type ReplaceDemandTagsInput = {
  context: OperationContext;
  demandId: string;
  tagValueIds: readonly string[];
};

/** Replaces a demand's tags as a set (join rows, ADR 0056). */
export async function replaceDemandTags({
  context,
  demandId,
  tagValueIds,
}: ReplaceDemandTagsInput) {
  await context.db.itemDemandTag.deleteMany({ where: { demandId } });
  if (!tagValueIds.length) return;
  await context.db.itemDemandTag.createMany({
    data: [...new Set(tagValueIds)].map((valueId) => ({
      demandId,
      valueId,
      organizationId: context.organizationId,
    })),
  });
}
