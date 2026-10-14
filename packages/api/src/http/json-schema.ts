import { z } from "zod";

export type JsonObject = Record<string, unknown>;
export type ToJsonSchemaInput = { schema: z.ZodType; io: "input" | "output" };

/** Zod → JSON Schema 2020-12 (the OpenAPI 3.1 dialect). Dates become date-time strings. */
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

export type PropertyKindInput = { property: unknown };
export type PropertyKind = "number" | "boolean" | "array" | "string";

/** Primitive kind of a JSON Schema property, looking through `nullable` unions. */
export function propertyKind({ property }: PropertyKindInput): PropertyKind {
  const schema = (property ?? {}) as JsonObject;
  const type = schema.type;
  if (type === "integer" || type === "number") return "number";
  if (type === "boolean" || type === "array") return type;
  const members = Array.isArray(schema.anyOf) ? schema.anyOf : [];
  const first = members.find((member) => (member as JsonObject).type !== "null");
  return first ? propertyKind({ property: first }) : "string";
}
