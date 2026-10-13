import type { z } from "zod";
import { builder, type ObjectRefOf } from "./builder";
import { objectShapes } from "./zod-shape";

export type ObjectFromSchemaInput = {
  /** GraphQL type name, e.g. `Venue`. */
  name: string;
  /** Zod output schema of the entity; its fields become GraphQL fields. */
  schema: z.ZodType;
  /** Fields that must not be exposed (e.g. `organizationId`). */
  omit?: readonly string[];
  description?: string;
};

/** Derives a GraphQL object type from a Zod object schema; relations are added by the caller. */
export function objectFromSchema<T extends object>({
  name,
  schema,
  omit,
  description,
}: ObjectFromSchemaInput): ObjectRefOf<T> {
  return builder.objectRef<T>(name).implement({
    ...(description ? { description } : {}),
    fields: (t) => {
      const fields: Record<string, ReturnType<typeof t.field>> = {};
      for (const [key, shape] of objectShapes({ schema, ...(omit ? { omit } : {}) })) {
        const type = key === "id" ? "ID" : shape.scalar;
        fields[key] = t.field({
          type: shape.list ? [type] : type,
          nullable: shape.nullable,
          ...(shape.description ? { description: shape.description } : {}),
          resolve: (parent) => (parent as Record<string, unknown>)[key] as never,
        });
      }
      return fields;
    },
  });
}
