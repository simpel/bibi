import { z } from "zod";

export type ScalarName = "String" | "Int" | "Float" | "Boolean" | "DateTime" | "JSON";

/** GraphQL-relevant facts about one Zod field. */
export type FieldShape = {
  scalar: ScalarName;
  list: boolean;
  nullable: boolean;
  optional: boolean;
  description: string | undefined;
};

type Acc = Omit<FieldShape, "scalar">;

function scalarOf({ schema }: { schema: z.ZodType }): ScalarName {
  if (schema instanceof z.ZodString || schema instanceof z.ZodEnum) return "String";
  if (schema instanceof z.ZodNumber) return schema.format === "safeint" ? "Int" : "Float";
  if (schema instanceof z.ZodBoolean) return "Boolean";
  if (schema instanceof z.ZodDate) return "DateTime";
  return "JSON";
}

function enumHint({ schema }: { schema: z.ZodType }): string | undefined {
  return schema instanceof z.ZodEnum ? `One of: ${schema.options.join(", ")}` : undefined;
}

/** Unwraps optional/nullable/default/array layers down to the scalar type. */
export function describeZod({ schema }: { schema: z.ZodType }): FieldShape {
  const acc: Acc = { list: false, nullable: false, optional: false, description: undefined };
  let current = schema;
  for (let depth = 0; depth < 10; depth++) {
    acc.description ??= current.description;
    if (current instanceof z.ZodOptional) acc.optional = true;
    else if (current instanceof z.ZodNullable) acc.nullable = true;
    else if (current instanceof z.ZodDefault) acc.optional = true;
    else if (current instanceof z.ZodArray && !acc.list) acc.list = true;
    else break;
    current = unwrap({ schema: current });
  }
  acc.description ??= enumHint({ schema: current });
  return { ...acc, scalar: scalarOf({ schema: current }) };
}

function unwrap({ schema }: { schema: z.ZodType }): z.ZodType {
  if (schema instanceof z.ZodArray) return schema.element as z.ZodType;
  if (schema instanceof z.ZodDefault) return schema.removeDefault() as z.ZodType;
  return (schema as z.ZodOptional | z.ZodNullable).unwrap() as z.ZodType;
}

export type ObjectShapesInput = { schema: z.ZodType; omit?: readonly string[] };

/** Field shapes of a Zod object schema, keyed by field name. */
export function objectShapes({ schema, omit = [] }: ObjectShapesInput): [string, FieldShape][] {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error("GraphQL derivation needs a z.object schema");
  }
  const entries = Object.entries(schema.shape as Record<string, z.ZodType>);
  return entries
    .filter(([key]) => !omit.includes(key))
    .map(([key, field]) => [key, describeZod({ schema: field })]);
}
