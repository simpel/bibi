import type { OperationContext } from "../../operations/types";

/** A dining room of the organization's published booking page by its slug, with a sitting. */
export async function publicRoom({
  context,
  roomSlug,
}: {
  context: Pick<OperationContext, "db">;
  roomSlug: string;
}) {
  const room = await context.db.diningRoom.findFirst({
    where: { slug: roomSlug },
    select: { itemId: true, item: { select: { name: true } } },
  });
  if (!room) return null;
  const sittings = await context.db.diningService.count({ where: { roomItemId: room.itemId } });
  return sittings > 0 ? { itemId: room.itemId, name: room.item.name } : null;
}
