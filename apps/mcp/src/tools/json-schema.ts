import { z } from "zod";
import type { JsonObject } from "./types";

export type ToJsonSchemaInput = { schema: z.ZodType; io: "input" | "output" };

/** Zod -> JSON Schema 2020-12 for `tools/list`. Dates travel as ISO strings (`date-time`). */
export function toJsonSchema({ schema, io }: ToJsonSchemaInput): JsonObject {
  const { $schema: _dialect, ...json } = z.toJSONSchema(schema, {
    io,
    unrepresentable: "any",
    override: ({ zodSchema, jsonSchema }) => {
      if (zodSchema._zod.def.type === "date") {
        jsonSchema.type = "string";
        jsonSchema.format = "date-time";
      }
    },
  });
  return json;
}
