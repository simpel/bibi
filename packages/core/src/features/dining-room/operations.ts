import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkRoomItem } from "./room-check";
import {
  type DiningRoomDto,
  DiningRoomGetInputSchema,
  DiningRoomListInputSchema,
  DiningRoomListOutputSchema,
  DiningRoomSchema,
  DiningRoomSetInputSchema,
} from "./schema";

type Row = { id: string; itemId: string; slug: string; openUntil: Date | null };

const toDto = ({ row }: { row: Row }): DiningRoomDto => ({
  id: row.id,
  itemId: row.itemId,
  slug: row.slug,
  openUntil: row.openUntil,
});

const SELECT = { id: true, itemId: true, slug: true, openUntil: true } as const;

type FindInput = { context: Pick<OperationContext, "db">; itemId: string };

/** The room's dining settings, or null when it is not set up for table booking. */
export async function findDiningRoom({ context, itemId }: FindInput) {
  const row = await context.db.diningRoom.findFirst({ where: { itemId }, select: SELECT });
  return row ? toDto({ row }) : null;
}

export const listDiningRooms = defineOperation({
  name: "diningRoom.list",
  kind: "query",
  description:
    "Rooms set up for table booking (ADR 0119): each room item with its booking page slug and " +
    "the instant bookings are open until.",
  input: DiningRoomListInputSchema,
  output: DiningRoomListOutputSchema,
  permission: "diningSetup:read",
  handler: async ({ context }) => {
    const rows = await context.db.diningRoom.findMany({ select: SELECT, orderBy: { slug: "asc" } });
    return ok({ value: { items: rows.map((row) => toDto({ row })) } });
  },
});

export const getDiningRoom = defineOperation({
  name: "diningRoom.get",
  kind: "query",
  description: "A room's table booking settings by its item id; NOT_FOUND when it has none.",
  input: DiningRoomGetInputSchema,
  output: DiningRoomSchema,
  permission: "diningSetup:read",
  handler: async ({ input, context }) => {
    const room = await findDiningRoom({ context, itemId: input.itemId });
    return room ? ok({ value: room }) : notFound({ entity: "Dining room" });
  },
});

export const setDiningRoom = defineOperation({
  name: "diningRoom.set",
  kind: "command",
  description:
    "Set a room (an item with setups) up for table booking, or change its booking page slug and " +
    "the instant bookings are open until, e.g. to release more dates to guests. A slug another " +
    "room uses is CONFLICT.",
  input: DiningRoomSetInputSchema,
  output: DiningRoomSchema,
  permission: "diningSetup:write",
  handler: async ({ input, context }) => {
    const { itemId, slug, openUntil } = input;
    const room = await checkRoomItem({ context, itemId });
    if (!room.ok) return room;
    const taken = await context.db.diningRoom.findFirst({
      where: { slug, itemId: { not: itemId } },
      select: { id: true },
    });
    if (taken) return conflict({ message: `Another dining room uses the address "${slug}"` });
    const before = await findDiningRoom({ context, itemId });
    const data = { slug, ...(openUntil === undefined ? {} : { openUntil }) };
    if (before) await context.db.diningRoom.updateMany({ where: { itemId }, data });
    else
      await context.db.diningRoom.create({
        data: { ...data, itemId, organizationId: context.organizationId },
      });
    const after = await findDiningRoom({ context, itemId });
    if (!after) return notFound({ entity: "Dining room" });
    context.recordChange({ entityId: after.id, before, after });
    return ok({ value: after });
  },
});

export const diningRoomOperations = [listDiningRooms, getDiningRoom, setDiningRoom];
