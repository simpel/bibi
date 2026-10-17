import type { JsonObject } from "@okazi/api";
import { objectProperties, type SchemaInput, variants } from "./schema-type";

type ExampleInput = SchemaInput & { depth?: number };

const STRING_EXAMPLES: Record<string, string> = {
  "date-time": "2026-11-05T09:00:00.000Z",
  date: "2026-11-05",
  email: "anna@example.com",
  uri: "https://example.com",
};

function scalarExample({ schema }: SchemaInput): unknown {
  if ("const" in schema) return schema.const;
  if (Array.isArray(schema.enum)) return schema.enum[0];
  if (schema.default !== undefined) return schema.default;
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type === "integer" || type === "number") return 1;
  if (type === "boolean") return true;
  if (type === "string") return STRING_EXAMPLES[String(schema.format)] ?? "string";
  return null;
}

/** A plausible example value for a schema, with only the required fields of objects. */
export function exampleValue({ schema, depth = 0 }: ExampleInput): unknown {
  if (depth > 4) return null;
  const [branch] = variants({ schema });
  if (branch && !schema.properties) return exampleValue({ schema: branch, depth });
  if (schema.type === "array") {
    return [exampleValue({ schema: (schema.items ?? {}) as JsonObject, depth: depth + 1 })];
  }
  const fields = objectProperties({ schema });
  if (!fields) return scalarExample({ schema });
  const wanted = fields.filter((field) => field.required);
  return Object.fromEntries(
    wanted.map((field) => [field.name, exampleValue({ schema: field.schema, depth: depth + 1 })]),
  );
}
