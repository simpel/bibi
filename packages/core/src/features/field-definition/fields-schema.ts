import { z } from "zod";
import type { FieldKind } from "./field-kinds";

/**
 * What the value schema needs to know about one field. `choices` are the allowed values of a
 * choice field: list value ids for a list, the option strings for inline options.
 */
export type FieldSpec = {
  key: string;
  name: string;
  kind: FieldKind;
  required: boolean;
  choices: readonly string[] | null;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

type ValueSchemaInput = { spec: FieldSpec };

function valueSchema({ spec }: ValueSchemaInput): z.ZodType {
  const oneOf = z
    .string()
    .refine((value) => spec.choices?.includes(value) ?? false, `Not a value of ${spec.name}`);
  switch (spec.kind) {
    case "TEXT":
      return z.string().trim().min(1).max(5000);
    case "NUMBER":
      return z.number().finite();
    case "BOOLEAN":
      return z.boolean();
    case "DATE":
      return z.string().regex(DATE, "Use YYYY-MM-DD");
    case "CHOICE":
      return oneOf;
    case "MULTI_CHOICE":
      return z
        .array(oneOf)
        .max(100)
        .refine((v) => new Set(v).size === v.length, "Duplicates");
  }
}

export type BuildFieldsSchemaInput = { specs: readonly FieldSpec[] };

/**
 * Zod schema for an entity's `fields` JSON, built from the type's field definitions (ADR 0021).
 * Strict: unknown keys fail. Required fields must be present; others may be omitted.
 */
export function buildFieldsSchema({ specs }: BuildFieldsSchemaInput) {
  const shape: Record<string, z.ZodType> = {};
  for (const spec of specs) {
    const value = valueSchema({ spec }).describe(spec.name);
    shape[spec.key] = spec.required ? value : value.optional();
  }
  return z.object(shape).strict();
}
