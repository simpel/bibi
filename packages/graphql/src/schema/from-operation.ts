import type { AnyOperation } from "@okazi/core";
import { argsFromSchema } from "./args-from-schema";
import { builder, type ObjectRefOf } from "./builder";
import { markExposed } from "./exposed-operations";
import { inputFromSchema } from "./input-from-schema";
import { runOperation } from "./run-operation";
import { stripNulls } from "./strip-nulls";

export type FromOperationInput<T> = {
  operation: AnyOperation;
  /** GraphQL return type; the operation's output must match its parent shape. */
  type: ObjectRefOf<T>;
  /** Field name; defaults to the camel-cased operation name (`venue.list` → `venueList`). */
  name?: string;
};

/** `venue.create` → `venueCreate`. */
export function fieldNameOf({ operation }: { operation: AnyOperation }): string {
  return operation.name.replace(/[._-](\w)/g, (_match, char: string) => char.toUpperCase());
}

/** Registers a query field whose flat args and description come from the operation. */
export function fieldFromOperation<T>({ operation, type, name }: FromOperationInput<T>): void {
  markExposed({ name: operation.name });
  const args = argsFromSchema({ schema: operation.input });
  builder.queryField(name ?? fieldNameOf({ operation }), (t) =>
    t.field({
      type,
      description: operation.description,
      args,
      resolve: async (_parent, rawArgs, ctx) => {
        const input = stripNulls({ schema: operation.input, args: rawArgs });
        return (await runOperation({ operation, input, ctx })) as T;
      },
    }),
  );
}

/** Registers a mutation `xyz(input: XyzInput!)` whose input type is derived from the operation. */
export function mutationFromOperation<T>({ operation, type, name }: FromOperationInput<T>): void {
  markExposed({ name: operation.name });
  const fieldName = name ?? fieldNameOf({ operation });
  const inputName = `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}Input`;
  const inputType = inputFromSchema({ name: inputName, schema: operation.input });
  builder.mutationField(fieldName, (t) =>
    t.field({
      type,
      description: operation.description,
      args: { input: t.arg({ type: inputType, required: true }) },
      resolve: async (_parent, { input: raw }, ctx) => {
        const input = stripNulls({ schema: operation.input, args: raw });
        return (await runOperation({ operation, input, ctx })) as T;
      },
    }),
  );
}
