import type { DiningServiceException } from "@bibi/db";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { fromDateColumn, toDateColumn } from "../../time/date-column";
import {
  DiningServiceExceptionDeleteInputSchema,
  type DiningServiceExceptionDto,
  DiningServiceExceptionListInputSchema,
  DiningServiceExceptionListOutputSchema,
  DiningServiceExceptionSchema,
  DiningServiceExceptionSetInputSchema,
} from "./schema";
import { findService } from "./service-rows";
import { isRoomLayout } from "./service-rules";

const toDto = ({ row }: { row: DiningServiceException }): DiningServiceExceptionDto => ({
  id: row.id,
  serviceId: row.serviceId,
  date: fromDateColumn({ value: row.date }),
  closed: row.closed,
  firstStartMinute: row.firstStartMinute,
  lastStartMinute: row.lastStartMinute,
  layoutId: row.layoutId,
  maxCoversPerSlot: row.maxCoversPerSlot,
  note: row.note,
});

export const listDiningServiceExceptions = defineOperation({
  name: "diningServiceException.list",
  kind: "query",
  description:
    "A sitting's dated exceptions (ADR 0119): days it is closed or runs with other times, layout " +
    "or pace, between two optional local dates.",
  input: DiningServiceExceptionListInputSchema,
  output: DiningServiceExceptionListOutputSchema,
  permission: "diningSetup:read",
  handler: async ({ input, context }) => {
    const service = await findService({ context, id: input.serviceId });
    if (!service) return notFound({ entity: "Sitting" });
    const date = {
      ...(input.from ? { gte: toDateColumn({ date: input.from }) } : {}),
      ...(input.to ? { lte: toDateColumn({ date: input.to }) } : {}),
    };
    const rows = await context.db.diningServiceException.findMany({
      where: { serviceId: input.serviceId, ...(input.from || input.to ? { date } : {}) },
      orderBy: { date: "asc" },
    });
    return ok({ value: { items: rows.map((row) => toDto({ row })) } });
  },
});

export const setDiningServiceException = defineOperation({
  name: "diningServiceException.set",
  kind: "command",
  description:
    "Close a sitting on one local date, or run it that day with other first and last starts, " +
    "another layout of the room or another pace. Replaces that date's exception. Existing " +
    "reservations that day are kept; staff see them on the day view.",
  input: DiningServiceExceptionSetInputSchema,
  output: DiningServiceExceptionSchema,
  permission: "diningSetup:write",
  handler: async ({ input, context }) => {
    const service = await findService({ context, id: input.serviceId });
    if (!service) return notFound({ entity: "Sitting" });
    const { serviceId, date, ...fields } = input;
    if ((fields.firstStartMinute === null) !== (fields.lastStartMinute === null)) {
      const message = "Give both the first and the last start, or neither";
      return invalid({ message, issues: [{ path: "lastStartMinute", message }] });
    }
    if (
      fields.firstStartMinute !== null &&
      fields.lastStartMinute !== null &&
      fields.lastStartMinute < fields.firstStartMinute
    ) {
      const message = "The last start is before the first";
      return invalid({ message, issues: [{ path: "lastStartMinute", message }] });
    }
    if (
      fields.layoutId &&
      !(await isRoomLayout({ context, roomItemId: service.roomItemId, layoutId: fields.layoutId }))
    ) {
      const message = "Not a layout of this room";
      return invalid({ message, issues: [{ path: "layoutId", message }] });
    }
    const key = { serviceId, date: toDateColumn({ date }) };
    const existing = await context.db.diningServiceException.findFirst({ where: key });
    const before = existing ? toDto({ row: existing }) : undefined;
    const row = existing
      ? await context.db.diningServiceException.update({ where: { id: existing.id }, data: fields })
      : await context.db.diningServiceException.create({
          data: { ...key, ...fields, organizationId: context.organizationId },
        });
    const after = toDto({ row });
    context.recordChange({ entityId: serviceId, before, after });
    return ok({ value: after });
  },
});

export const deleteDiningServiceException = defineOperation({
  name: "diningServiceException.delete",
  kind: "command",
  description: "Remove a sitting's exception on one local date: the sitting runs as usual again.",
  input: DiningServiceExceptionDeleteInputSchema,
  output: DiningServiceExceptionSchema,
  permission: "diningSetup:write",
  handler: async ({ input, context }) => {
    const service = await findService({ context, id: input.serviceId });
    if (!service) return notFound({ entity: "Sitting" });
    const key = { serviceId: input.serviceId, date: toDateColumn({ date: input.date }) };
    const existing = await context.db.diningServiceException.findFirst({ where: key });
    if (!existing) return notFound({ entity: "Exception" });
    await context.db.diningServiceException.delete({ where: { id: existing.id } });
    const before = toDto({ row: existing });
    context.recordChange({ entityId: input.serviceId, before });
    return ok({ value: before });
  },
});

export const exceptionOperations = [
  listDiningServiceExceptions,
  setDiningServiceException,
  deleteDiningServiceException,
];
