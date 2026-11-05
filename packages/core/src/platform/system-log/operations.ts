import type { Prisma } from "@bibi/db";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { definePlatformOperation } from "../define-platform-operation";
import {
  SystemLogIdInputSchema,
  SystemLogListInputSchema,
  SystemLogListOutputSchema,
  type SystemLogListSort,
  SystemLogSchema,
} from "./schema";
import { toEntry } from "./to-entry";
import { systemLogWhere } from "./where";

type Order = Prisma.SystemLogOrderByWithRelationInput;

const ORDERS: Record<SystemLogListSort, (direction: "asc" | "desc") => Order> = {
  time: (direction) => ({ time: direction }),
  level: (direction) => ({ level: direction }),
  event: (direction) => ({ event: direction }),
  operation: (direction) => ({ operation: { sort: direction, nulls: "last" } }),
  surface: (direction) => ({ surface: { sort: direction, nulls: "last" } }),
  status: (direction) => ({ status: { sort: direction, nulls: "last" } }),
  duration: (direction) => ({ durationMs: { sort: direction, nulls: "last" } }),
};

export const listSystemLogs = definePlatformOperation({
  name: "systemLog.list",
  kind: "query",
  description: "Page through the persisted system log, newest first, with filters and sorting.",
  input: SystemLogListInputSchema,
  output: SystemLogListOutputSchema,
  handler: async ({ input: { page, pageSize, sort, direction, ...filters }, context }) => {
    const where = systemLogWhere({ filters });
    const order = ORDERS[sort](direction);
    const [total, items] = await Promise.all([
      context.db.systemLog.count({ where }),
      context.db.systemLog.findMany({
        where,
        orderBy:
          sort === "time"
            ? [{ time: direction }, { id: "desc" }]
            : [order, { time: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const entries = items.map((row) => toEntry({ row }));
    return ok({ value: { items: entries, total, page, pageSize, pageCount } });
  },
});

export const getSystemLog = definePlatformOperation({
  name: "systemLog.get",
  kind: "query",
  description: "Get one system log entry with its full data.",
  input: SystemLogIdInputSchema,
  output: SystemLogSchema,
  handler: async ({ input, context }) => {
    const entry = await context.db.systemLog.findUnique({ where: { id: input.id } });
    if (entry) return ok({ value: toEntry({ row: entry }) });
    return err({ error: new AppError({ code: "NOT_FOUND", message: "Log entry not found" }) });
  },
});
