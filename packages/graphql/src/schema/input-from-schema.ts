import type { InputFieldRef, InputObjectRef } from "@pothos/core";
import type { z } from "zod";
import { builder, type Types } from "./builder";
import { objectShapes } from "./zod-shape";

export type InputFromSchemaInput = { name: string; schema: z.ZodType; description?: string };

/** Derives a GraphQL input object (mutation `input` argument) from a Zod object schema. */
export function inputFromSchema({
  name,
  schema,
  description,
}: InputFromSchemaInput): InputObjectRef<Types, Record<string, unknown>> {
  return builder.inputRef<Record<string, unknown>>(name).implement({
    ...(description ? { description } : {}),
    fields: (t) => {
      const fields: Record<
        string,
        InputFieldRef<Types, NonNullable<unknown> | null | undefined>
      > = {};
      for (const [key, shape] of objectShapes({ schema })) {
        fields[key] = t.field({
          type: shape.list ? [shape.scalar] : shape.scalar,
          required: !shape.optional && !shape.nullable,
          ...(shape.description ? { description: shape.description } : {}),
        });
      }
      return fields;
    },
  });
}
