/** One relation field: the model it points to and whether it is a list (to-many). */
export type RelationField = { readonly target: string; readonly list: boolean };

/** Model → relation field → target (ADR 0113), generated from the schema. */
export type RelationMap = Readonly<Record<string, Readonly<Record<string, RelationField>>>>;
