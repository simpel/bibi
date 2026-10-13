import type { z } from "zod";
import { objectShapes } from "./zod-shape";

export type StripNullsInput = { schema: z.ZodType; args: Record<string, unknown> };

/** GraphQL clients send `null` for "not set"; drop it where the Zod field is not nullable. */
export function stripNulls({ schema, args }: StripNullsInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const nullable = new Set(
    objectShapes({ schema })
      .filter(([, shape]) => shape.nullable)
      .map(([key]) => key),
  );
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || (value === null && !nullable.has(key))) continue;
    out[key] = value;
  }
  return out;
}
