import type { EntityTypeDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
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
 * has its own fields. Localized messages as everywhere (`useZodMessages`). react-hook-form keeps
 * the first resolver it gets, so this one reads the latest types and schema from a ref: a list
 * value created while the form is open (`Create value`) passes once the page has refreshed.
 */
export function useTypedResolver<V extends FieldValues & { entityTypeId: string }, O>({
  types,
  schemaFor,
}: UseTypedResolverInput): Resolver<V, unknown, O> {
  const messages = useZodMessages();
  const latest = useRef({ types, schemaFor, messages });
  latest.current = { types, schemaFor, messages };
  return (values, context, options) => {
    const current = latest.current;
    const type = current.types.find(({ id }) => id === values.entityTypeId);
    const schema = current.schemaFor({ type }) as z.ZodType<O, V>;
    return zodResolver(schema, current.messages)(values, context, options) as ReturnType<
      Resolver<V, unknown, O>
    >;
  };
}
