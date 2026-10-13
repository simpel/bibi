import type { z } from "zod";
import { builder } from "./builder";
import { objectShapes } from "./zod-shape";

export type ArgsFromSchemaInput = { schema: z.ZodType };

/** Flat query arguments derived from a Zod object schema (`limit`, `cursor`, `id`, ...). */
export function argsFromSchema({ schema }: ArgsFromSchemaInput) {
  return builder.args((t) => {
    const args: Record<string, ReturnType<typeof t.field>> = {};
    for (const [key, shape] of objectShapes({ schema })) {
      args[key] = t.field({
        type: shape.list ? [shape.scalar] : shape.scalar,
        required: !shape.optional && !shape.nullable,
        ...(shape.description ? { description: shape.description } : {}),
      });
    }
    return args;
  });
}
