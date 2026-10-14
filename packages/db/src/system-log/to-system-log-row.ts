import type { Prisma } from "../generated/prisma/client";

export type ToSystemLogRowInput = { entry: Record<string, unknown> };

const str = ({ value }: { value: unknown }): string | null =>
  typeof value === "string" && value !== "" ? value : null;

const num = ({ value }: { value: unknown }): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const dateOf = ({ value }: { value: unknown }): Date => {
  const date = new Date(typeof value === "string" || typeof value === "number" ? value : NaN);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

/** One JSON log line (ADR 0014 shape) → a `SystemLog` row; the full line is kept in `data`. */
export function toSystemLogRow({ entry }: ToSystemLogRowInput): Prisma.SystemLogCreateManyInput {
  const status = num({ value: entry.status });
  return {
    time: dateOf({ value: entry.time }),
    level: str({ value: entry.level }) ?? "info",
    event: str({ value: entry.event }) ?? "unknown",
    msg: str({ value: entry.msg }),
    service: str({ value: entry.service }) ?? "unknown",
    surface: str({ value: entry.surface }),
    requestId: str({ value: entry.requestId }),
    organizationId: str({ value: entry.organizationId }),
    userId: str({ value: entry.userId }) ?? str({ value: entry.actorId }),
    operation: str({ value: entry.operation }) ?? str({ value: entry.tool }),
    status: status === null ? null : Math.trunc(status),
    durationMs: num({ value: entry.durationMs }),
    errorCode: str({ value: entry.errorCode }),
    data: entry as Prisma.InputJsonValue,
  };
}
