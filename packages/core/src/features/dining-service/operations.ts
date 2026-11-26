import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { checkRoomItem } from "../dining-room/room-check";
import { exceptionOperations } from "./exception-operations";
import {
  DiningServiceCreateInputSchema,
  DiningServiceIdInputSchema,
  DiningServiceListInputSchema,
  DiningServiceListOutputSchema,
  DiningServiceSchema,
  DiningServiceUpdateInputSchema,
} from "./schema";
import { findService, toServiceDto } from "./service-rows";
import { checkService } from "./service-rules";

export const listDiningServices = defineOperation({
  name: "diningService.list",
  kind: "query",
  description:
    "Sittings (ADR 0119): when each dining room takes table bookings, with which layout, at what " +
    "pace and under which online rules. Filter by room.",
  input: DiningServiceListInputSchema,
  output: DiningServiceListOutputSchema,
  permission: "diningSetup:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.diningService.findMany({
      where: input.roomItemId ? { roomItemId: input.roomItemId } : {},
      orderBy: [{ firstStartMinute: "asc" }, { name: "asc" }],
    });
    return ok({ value: { items: rows.map((row) => toServiceDto({ row })) } });
  },
});

export const getDiningService = defineOperation({
  name: "diningService.get",
  kind: "query",
  description: "One sitting with its times, layout, pace and online rules.",
  input: DiningServiceIdInputSchema,
  output: DiningServiceSchema,
  permission: "diningSetup:read",
  handler: async ({ input, context }) => {
    const found = await findService({ context, id: input.id });
    return found ? ok({ value: found }) : notFound({ entity: "Sitting" });
  },
});

export const createDiningService = defineOperation({
  name: "diningService.create",
  kind: "command",
  description:
    "Create a sitting in a dining room, e.g. Dinner Tuesday to Saturday, first booking 17:00, last " +
    "21:00, layout Dinner, 24 new guests per 15 minutes. The room must be set up first " +
    "(diningRoom.set); the layout must be one of the room's (else VALIDATION). Names are unique " +
    "per room (CONFLICT).",
  input: DiningServiceCreateInputSchema,
  output: DiningServiceSchema,
  permission: "diningSetup:write",
  handler: async ({ input, context }) => {
    const room = await checkRoomItem({ context, itemId: input.roomItemId, path: "roomItemId" });
    if (!room.ok) return room;
    const checked = await checkService({ context, roomItemId: input.roomItemId, service: input });
    if (!checked.ok) return checked;
    const row = await context.db.diningService.create({
      data: { ...input, organizationId: context.organizationId },
    });
    const after = toServiceDto({ row });
    context.recordChange({ entityId: after.id, after });
    return ok({ value: after });
  },
});

export const updateDiningService = defineOperation({
  name: "diningService.update",
  kind: "command",
  description:
    "Change a sitting: name, layout, weekdays, times, season, pace, turn times, online rules or " +
    "deposit. Omitted fields are unchanged. Existing reservations keep their tables and times.",
  input: DiningServiceUpdateInputSchema,
  output: DiningServiceSchema,
  permission: "diningSetup:write",
  handler: async ({ input: { id, ...changes }, context }) => {
    const before = await findService({ context, id });
    if (!before) return notFound({ entity: "Sitting" });
    const defined = Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined));
    const merged = { ...before, ...defined };
    const checked = await checkService({
      context,
      roomItemId: before.roomItemId,
      service: merged,
      id,
    });
    if (!checked.ok) return checked;
    const row = await context.db.diningService.update({ where: { id }, data: defined });
    const after = toServiceDto({ row });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const archiveDiningService = defineOperation({
  name: "diningService.archive",
  kind: "command",
  description:
    "Archive a sitting: guests can no longer book it. Existing reservations stay as they are.",
  input: DiningServiceIdInputSchema,
  output: DiningServiceSchema,
  permission: "diningSetup:delete",
  handler: async ({ input, context }) => {
    const before = await findService({ context, id: input.id });
    if (!before) return notFound({ entity: "Sitting" });
    const row = await context.db.diningService.update({
      where: { id: input.id },
      data: { status: "ARCHIVED" },
    });
    const after = toServiceDto({ row });
    context.recordChange({ entityId: input.id, before, after });
    return ok({ value: after });
  },
});

export const diningServiceOperations = [
  listDiningServices,
  getDiningService,
  createDiningService,
  updateDiningService,
  archiveDiningService,
  ...exceptionOperations,
];
