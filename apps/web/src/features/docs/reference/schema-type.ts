import type { JsonObject } from "@bibi/api";

export type SchemaInput = { schema: JsonObject };

export type SchemaProperty = { name: string; schema: JsonObject; required: boolean };

const asList = ({ value }: { value: unknown }): JsonObject[] =>
  Array.isArray(value) ? (value as JsonObject[]) : [];

/** The non-null branches of an `anyOf`/`oneOf` (nullable fields are `anyOf: [T, null]`). */
export function variants({ schema }: SchemaInput): JsonObject[] {
  return [...asList({ value: schema.anyOf }), ...asList({ value: schema.oneOf })].filter(
    (branch) => branch.type !== "null",
  );
}

/** Short type label for one schema node, e.g. `string (date-time)`, `Venue[]`, `a | b`. */
export function schemaType({ schema }: SchemaInput): string {
  if (typeof schema.$ref === "string") return schema.$ref.split("/").pop() ?? "object";
  if ("const" in schema) return JSON.stringify(schema.const);
  if (Array.isArray(schema.enum)) return "enum";
  const branches = variants({ schema });
  if (branches.length > 0) {
    const labels = branches.map((branch) => schemaType({ schema: branch }));
    return [...new Set(labels)].join(" | ");
  }
  if (schema.type === "array") {
    return `${schemaType({ schema: (schema.items ?? {}) as JsonObject })}[]`;
  }
  const type = Array.isArray(schema.type)
    ? schema.type.filter((part) => part !== "null").join(" | ")
    : String(schema.type ?? "any");
  return typeof schema.format === "string" ? `${type} (${schema.format})` : type;
}

/** Whether `null` is accepted (`anyOf` with a null branch or `type: [T, "null"]`). */
export function isNullable({ schema }: SchemaInput): boolean {
  const branches = [...asList({ value: schema.anyOf }), ...asList({ value: schema.oneOf })];
  return (
    branches.some((branch) => branch.type === "null") ||
    (Array.isArray(schema.type) && schema.type.includes("null"))
  );
}

/** Fields of an object schema, looking through arrays and nullable wrappers. */
export function objectProperties({ schema }: SchemaInput): SchemaProperty[] | undefined {
  if (schema.type === "array")
    return objectProperties({ schema: (schema.items ?? {}) as JsonObject });
  const [single] = variants({ schema });
  if (!schema.properties && single && variants({ schema }).length === 1) {
    return objectProperties({ schema: single });
  }
  if (typeof schema.properties !== "object" || schema.properties === null) return undefined;
  const required = new Set(Array.isArray(schema.required) ? (schema.required as string[]) : []);
  return Object.entries(schema.properties as Record<string, JsonObject>).map(([name, child]) => ({
    name,
    schema: child,
    required: required.has(name),
  }));
}
