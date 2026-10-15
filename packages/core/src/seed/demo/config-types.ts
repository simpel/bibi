import type { EntityBase, ItemBehaviour } from "../../features/entity-type/behaviour-kinds";
import type { FieldKind } from "../../features/field-definition/field-kinds";
import type { PRICE_UNITS } from "../../features/item/schema";
import type { VocabularyTemplateKey } from "../../templates/vocabularies/vocabulary-templates";

/** A field on a demo type. `list` is the name of one of the org's lists. */
export type DemoField = {
  name: string;
  kind: FieldKind;
  list?: string;
  options?: readonly string[];
};

export type DemoType = {
  base: EntityBase;
  name: string;
  behaviours?: readonly ItemBehaviour[];
  fields?: readonly DemoField[];
};

/** A part of a COMPOSABLE demo item, by the name of an item seeded before it. */
export type DemoPart = {
  name: string;
  quantity?: number;
  offsetMinutes?: number;
  durationMinutes?: number;
  required?: boolean;
};

/** Field values by field name; choice values by value or option name. */
export type DemoFieldValues = Readonly<
  Record<string, string | number | boolean | readonly string[]>
>;

/**
 * A demo item. Field values are given by field name; choice values by value or option name.
 * `setups` maps setup name → capacity, `parts` lists earlier items by name. Prices are in kronor excl. VAT.
 */
export type DemoItem = {
  type: string;
  name: string;
  fields?: DemoFieldValues;
  priceKr?: number;
  priceUnit?: (typeof PRICE_UNITS)[number];
  setups?: Readonly<Record<string, number>>;
  parts?: readonly DemoPart[];
};

/** Slice 2 of ADR 0025: what the organization configures (`docs/demo-seed.md`). */
export type DemoConfig = {
  listTemplates: readonly VocabularyTemplateKey[];
  lists: readonly { name: string; values: readonly string[] }[];
  setups: readonly { name: string; changeoverMinutes: number }[];
  types: readonly DemoType[];
  venue: { name: string; streetAddress: string; postalCode: string; city: string };
  /** Seeded in the venue. Slice 2 seeds the bookable spaces; the rest of the catalog is slice 3. */
  items: readonly DemoItem[];
  /** Org-specific checks (`docs/demo-seed.md`, Checks), e.g. check 2. */
  checks: { absentLists?: readonly string[]; listSizes?: Readonly<Record<string, number>> };
};
