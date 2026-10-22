import type { EntityTypeDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";
import { useZodMessages } from "@/lib/use-zod-messages";

export type UseTypedResolverInput = {
  types: EntityTypeDto[];
  /** Core's input schema with `fields` checked against the type (`buildFieldsSchema`). */
  schemaFor: (input: { type: EntityTypeDto | undefined }) => z.ZodType;
};

/**
 * Resolver for a typed record form: the schema is built per selected type, because each type
 * has its own fields. Localized messages as everywhere (`useZodMessages`).
 */
export function useTypedResolver<V extends FieldValues & { entityTypeId: string }, O>({
  types,
  schemaFor,
}: UseTypedResolverInput): Resolver<V, unknown, O> {
  const messages = useZodMessages();
  return (values, context, options) => {
    const type = types.find(({ id }) => id === values.entityTypeId);
    const schema = schemaFor({ type }) as z.ZodType<O, V>;
    return zodResolver(schema, messages)(values, context, options) as ReturnType<
      Resolver<V, unknown, O>
    >;
  };
}
