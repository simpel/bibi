import type { ZodError } from "zod";
import { AppError } from "./app-error";

export type FromZodErrorInput = { error: ZodError; message?: string };

export function fromZodError({ error, message = "Invalid input" }: FromZodErrorInput): AppError {
  const issues = error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
  return new AppError({ code: "VALIDATION", message, issues, cause: error });
}
