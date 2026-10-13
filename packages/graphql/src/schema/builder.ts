import SchemaBuilder, { type ObjectRef } from "@pothos/core";
import type { GraphqlContext } from "./context";

type Params = {
  Context: GraphqlContext;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: unknown; Output: unknown };
  };
};

export type Types = PothosSchemaTypes.ExtendDefaultTypes<Params>;
/** Reference to an object type whose parent value is `T`. */
export type ObjectRefOf<T> = ObjectRef<Types, T>;

/** One shared builder; feature files add their types and fields to it on import. */
export const builder = new SchemaBuilder<Params>({ defaultFieldNullability: false });

builder.queryType({});
builder.mutationType({});
