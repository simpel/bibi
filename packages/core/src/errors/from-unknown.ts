import { Prisma, ScopeViolationError } from "@okazi/db";
import { ZodError } from "zod";
import { AppError } from "./app-error";
import { fromZodError } from "./from-zod-error";

export type FromUnknownInput = { error: unknown };

type Mapped = { code: AppError["code"]; message: string };

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

/** The Postgres SQLSTATE behind a driver adapter error, if any. */
function postgresCode({ error }: { error: KnownError }): string | undefined {
  const cause = (error.meta?.driverAdapterError as { cause?: { code?: unknown } } | undefined)
    ?.cause;
  return typeof cause?.code === "string" ? cause.code : undefined;
}

function fromPrisma({ error }: { error: KnownError }): Mapped | undefined {
  return PRISMA_CODES[error.code] ?? POSTGRES_CODES[postgresCode({ error }) ?? ""];
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
