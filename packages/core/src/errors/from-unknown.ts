import { Prisma, ScopeViolationError } from "@okazi/db";
import { ZodError } from "zod";
import { AppError } from "./app-error";
import { fromZodError } from "./from-zod-error";

export type FromUnknownInput = { error: unknown };

const PRISMA_CODES: Record<string, { code: AppError["code"]; message: string }> = {
  P2025: { code: "NOT_FOUND", message: "Record not found" },
  P2002: { code: "CONFLICT", message: "Unique constraint violated" },
  P2003: { code: "VALIDATION", message: "Referenced record does not exist" },
};

/** Normalises anything thrown (Zod, Prisma, scope guard, bugs) into an AppError. */
export function fromUnknown({ error }: FromUnknownInput): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) return fromZodError({ error });
  if (error instanceof ScopeViolationError) {
    return new AppError({ code: "FORBIDDEN", message: "Access denied", cause: error });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_CODES[error.code];
    if (mapped) return new AppError({ ...mapped, cause: error });
  }
  return new AppError({ code: "INTERNAL", message: "Internal error", cause: error });
}
