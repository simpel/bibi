import { z } from "zod";

export type FormSchemaInput<V, S extends z.ZodType> = {
  /** Core operation input schema; the single source of validation rules. */
  schema: S;
  /** Maps raw form values (strings) to the shape `schema` expects. */
  toInput: (args: { values: V }) => unknown;
};

/**
 * Wraps a core Zod schema so react-hook-form can validate raw form values with it:
 * `zodResolver(formSchema({ schema, toInput }))`. Issue paths equal form field names.
 */
export function formSchema<V, S extends z.ZodType>({ schema, toInput }: FormSchemaInput<V, S>) {
  return z
    .custom<V>()
    .transform((values) => toInput({ values }))
    .pipe(schema);
}
