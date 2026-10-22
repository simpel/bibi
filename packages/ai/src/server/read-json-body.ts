import { AppError, err, fromZodError, ok, type Result } from "@bibi/core";
import type { z } from "zod";

export type ReadJsonBodyInput<S extends z.ZodType> = { request: Request; schema: S };

/** Parses and Zod-validates a JSON request body; VALIDATION error on bad JSON or shape. */
export async function readJsonBody<S extends z.ZodType>({
  request,
  schema,
}: ReadJsonBodyInput<S>): Promise<Result<z.infer<S>>> {
  const json: unknown = await request.json().catch(() => undefined);
  if (json === undefined) {
    return err({ error: new AppError({ code: "VALIDATION", message: "Body must be JSON" }) });
  }
  const parsed = schema.safeParse(json);
  return parsed.success
    ? ok({ value: parsed.data })
    : err({ error: fromZodError({ error: parsed.error }) });
}
