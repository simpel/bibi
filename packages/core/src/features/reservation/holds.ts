import type { OperationContext } from "../../operations/types";

type Ctx = { context: Pick<OperationContext, "db" | "organizationId"> };

export type WriteHoldsInput = Ctx & {
  reservationId: string;
  elementIds: readonly string[];
  startsAt: Date;
  endsAt: Date;
};

/**
 * Holds the reservation's tables (ADR 0119). Staff may book over an online-only block: the block
 * is cut around the booking first, so the exclusion constraint sees no overlap. Any other overlap
 * fails the constraint (CONFLICT).
 */
export async function writeHolds({
  context,
  reservationId,
  elementIds,
  startsAt,
  endsAt,
}: WriteHoldsInput) {
  const { db, organizationId } = context;
  const blocks = await db.tableHold.findMany({
    where: {
      elementId: { in: [...elementIds] },
      kind: "ONLINE_ONLY",
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  for (const block of blocks) {
    await db.tableHold.update({ where: { id: block.id }, data: { status: "ARCHIVED" } });
    const parts = [
      { startsAt: block.startsAt, endsAt: startsAt },
      { startsAt: endsAt, endsAt: block.endsAt },
    ].filter((part) => part.endsAt > part.startsAt);
    for (const part of parts) {
      await db.tableHold.create({
        data: {
          ...part,
          organizationId,
          elementId: block.elementId,
          kind: "ONLINE_ONLY",
          note: block.note,
        },
      });
    }
  }
  await db.tableHold.createMany({
    data: elementIds.map((elementId) => ({
      ...{
        organizationId,
        elementId,
        reservationId,
        kind: "RESERVATION" as const,
        startsAt,
        endsAt,
      },
    })),
  });
}

/** Lets the reservation's tables go: its holds are archived (released). */
export async function releaseHolds({ context, reservationId }: Ctx & { reservationId: string }) {
  await context.db.tableHold.updateMany({ where: { reservationId }, data: { status: "ARCHIVED" } });
}
