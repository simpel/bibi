import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { paginate } from "../shared/paginate";
import { roomEmbeddable } from "./embeddable";
import {
  RoomCreateInputSchema,
  RoomIdInputSchema,
  RoomListInputSchema,
  RoomListOutputSchema,
  RoomSchema,
  RoomUpdateInputSchema,
} from "./schema";

const notFound = () =>
  err({ error: new AppError({ code: "NOT_FOUND", message: "Room not found" }) });

export const listRooms = defineOperation({
  name: "room.list",
  kind: "query",
  description: "List active rooms (rum) of the organization, optionally for one venue.",
  input: RoomListInputSchema,
  output: RoomListOutputSchema,
  permission: "room:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.room.findMany({
      where: input.venueId ? { venueId: input.venueId } : {},
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getRoom = defineOperation({
  name: "room.get",
  kind: "query",
  description: "Get one room by id.",
  input: RoomIdInputSchema,
  output: RoomSchema,
  permission: "room:read",
  handler: async ({ input, context }) => {
    const room = await context.db.room.findFirst({ where: { id: input.id } });
    return room ? ok({ value: room }) : notFound();
  },
});

export const createRoom = defineOperation({
  name: "room.create",
  kind: "command",
  description: "Create a bookable room in an active venue.",
  input: RoomCreateInputSchema,
  output: RoomSchema,
  permission: "room:write",
  embeddable: roomEmbeddable,
  handler: async ({ input, context }) => {
    const venue = await context.db.venue.findFirst({ where: { id: input.venueId } });
    if (!venue) {
      const issues = [{ path: "venueId", message: "Venue not found" }];
      const error = new AppError({ code: "VALIDATION", message: "Unknown venue", issues });
      return err({ error });
    }
    const room = await context.db.room.create({
      data: { ...input, organizationId: context.organizationId, createdBy: context.actor.userId },
    });
    context.recordChange({ entityId: room.id, after: room });
    return ok({ value: room });
  },
});

export const updateRoom = defineOperation({
  name: "room.update",
  kind: "command",
  description: "Update fields of an active room. Omitted fields are left unchanged.",
  input: RoomUpdateInputSchema,
  output: RoomSchema,
  permission: "room:write",
  embeddable: roomEmbeddable,
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await context.db.room.findFirst({ where: { id } });
    if (!before) return notFound();
    const room = await context.db.room.update({ where: { id }, data });
    context.recordChange({ entityId: id, before, after: room });
    return ok({ value: room });
  },
});

export const archiveRoom = defineOperation({
  name: "room.archive",
  kind: "command",
  description: "Archive (soft-delete) a room. Archived rooms are hidden from lists and search.",
  input: RoomIdInputSchema,
  output: RoomSchema,
  permission: "room:write",
  embeddable: roomEmbeddable,
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.room.findFirst({ where: { id } });
    if (!before) return notFound();
    const room = await context.db.room.update({ where: { id }, data: { status: "ARCHIVED" } });
    context.recordChange({ entityId: id, before, after: room });
    return ok({ value: room });
  },
});

export const roomOperations = [listRooms, getRoom, createRoom, updateRoom, archiveRoom];
