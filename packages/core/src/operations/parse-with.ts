import type { z } from "zod";
import { AppError } from "../errors/app-error";
import { fromZodError } from "../errors/from-zod-error";
import { err, ok, type Result } from "../errors/result";

export type ParseWithInput<S extends z.ZodType> = {
  schema: S;
  data: unknown;
  /** `input` → VALIDATION (caller's fault); `output` → INTERNAL (handler bug). */
  side: "input" | "output";
};

export function parseWith<S extends z.ZodType>({
  schema,
  data,
  side,
}: ParseWithInput<S>): Result<z.infer<S>> {
  const parsed = schema.safeParse(data);
  if (parsed.success) return ok({ value: parsed.data });
  if (side === "input") return err({ error: fromZodError({ error: parsed.error }) });
  const message = "Operation returned invalid output";
  return err({ error: new AppError({ code: "INTERNAL", message, cause: parsed.error }) });
}
