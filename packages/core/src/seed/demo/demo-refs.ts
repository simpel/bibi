/** A field as the seed refers to it: its key, and value name → id for list-backed fields. */
export type FieldRef = { key: string; values?: ReadonlyMap<string, string> };

/** A type (item, customer, contact, ticket) as the seed refers to it: id plus field name → field. */
export type TypeRef = { id: string; fields: ReadonlyMap<string, FieldRef> };

/** Names → ids created during the seed, so data files can refer to rows by name. */
export type DemoRefs = {
  lists: Map<string, { id: string; values: { id: string; name: string }[] }>;
  setups: Map<string, string>;
  itemTypes: Map<string, TypeRef>;
  customerTypes: Map<string, TypeRef>;
  contactTypes: Map<string, TypeRef>;
  ticketTypes: Map<string, TypeRef>;
};
