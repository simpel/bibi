import { Prisma, ScopeViolationError } from "@bibi/db";
import { ZodError } from "zod";
import { AppError, type AppErrorIssue } from "./app-error";
import { fromZodError } from "./from-zod-error";

export type FromUnknownInput = { error: unknown };

type Mapped = { code: AppError["code"]; message: string; issues?: AppErrorIssue[] };

const PRISMA_CODES: Record<string, Mapped> = {
  P2025: { code: "NOT_FOUND", message: "Record not found" },
  P2002: { code: "CONFLICT", message: "Unique constraint violated" },
  P2003: { code: "VALIDATION", message: "Referenced record does not exist" },
};

/**
 * Postgres errors Prisma has no code of its own for (it reports them as P2039 with the driver's
 * code), e.g. the occupancy exclusion constraint (ADR 0022).
 */
const POSTGRES_CODES: Record<string, Mapped> = {
  "23P01": { code: "CONFLICT", message: "Overlaps an existing record" },
  "23514": { code: "VALIDATION", message: "Check constraint violated" },
};

type KnownError = InstanceType<typeof Prisma.PrismaClientKnownRequestError>;

type PostgresCause = { code?: unknown; message?: unknown; detail?: unknown };

/** The Postgres error behind a driver adapter error, if any. */
function postgresCause({ error }: { error: KnownError }): PostgresCause | undefined {
  return (error.meta?.driverAdapterError as { cause?: PostgresCause } | undefined)?.cause;
}

/** The message the line holds trigger raises an overlap with (`sync_line_occupancy.sql`). */
const LINE_OCCUPANCY_CONFLICT = "line_occupancy_conflict";

/**
 * An overlap raised by the line holds trigger (ADR 0053) names the lines in its detail, comma
 * separated: one `lines.<id>` issue each, like the up-front collision check.
 */
function lineConflict({ cause }: { cause: PostgresCause }): Mapped | undefined {
  if (cause.message !== LINE_OCCUPANCY_CONFLICT || typeof cause.detail !== "string") return;
  const message = "The line's hold or buffers overlap another booking, buffer or block on its item";
  const issues = cause.detail
    .split(",")
    .filter((id) => id.length > 0)
    .map((id) => ({ path: `lines.${id}`, message }));
  return { code: "CONFLICT", message, issues };
}

/**
 * A history row written against a status or state that changed in the meantime (ADR 0054,
 * `domain_history.sql`): a concurrent change won.
 */
const HISTORY_STALE: Mapped = {
  code: "CONFLICT",
  message: "Changed by someone else in the meantime: reload and try again",
};

function fromPrisma({ error }: { error: KnownError }): Mapped | undefined {
  const known = PRISMA_CODES[error.code];
  if (known) return known;
  const cause = postgresCause({ error });
  if (!cause) return;
  const line = lineConflict({ cause });
  if (line) return line;
  if (cause.message === "history_stale") return HISTORY_STALE;
  return typeof cause.code === "string" ? POSTGRES_CODES[cause.code] : undefined;
}

/** Normalises anything thrown (Zod, Prisma, scope guard, bugs) into an AppError. */
export function fromUnknown({ error }: FromUnknownInput): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) return fromZodError({ error });
  if (error instanceof ScopeViolationError) {
    return new AppError({ code: "FORBIDDEN", message: "Access denied", cause: error });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = fromPrisma({ error });
    if (mapped) return new AppError({ ...mapped, cause: error });
  }
  return new AppError({ code: "INTERNAL", message: "Internal error", cause: error });
}
