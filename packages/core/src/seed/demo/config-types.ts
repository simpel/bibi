import type { EntityBase, ItemBehaviour } from "../../features/entity-type/behaviour-kinds";
import type { FieldKind } from "../../features/field-definition/field-kinds";
import type { PRICE_UNITS } from "../../features/item/schema";
import type { ItemStateTemplateKey } from "../../templates/item-states/item-state-templates";
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
  /** Item types: the states the type gets from a template (ADR 0044); default one "Active". */
  states?: ItemStateTemplateKey;
};

/** A part of a COMPOSABLE demo item, by the name of an item seeded before it. */
export type DemoPart = {
  name: string;
  quantity?: number;
  offsetMinutes?: number;
  durationMinutes?: number;
  required?: boolean;
};

/** A choice group (CHOICES): pick `pick` (default 1) of the options, which become parts too. */
export type DemoChoiceGroup = { name: string; pick?: number; options: readonly DemoPart[] };

/** Field values by field name; choice values by value or option name. */
export type DemoFieldValues = Readonly<
  Record<string, string | number | boolean | readonly string[]>
>;

/**
 * A demo item. Field values are given by field name; choice values by value or option name.
 * `setups` maps setup name → capacity, `parts` and `choices` list earlier items by name. Prices are in kronor excl. VAT.
 */
export type DemoItem = {
  type: string;
  name: string;
  fields?: DemoFieldValues;
  priceKr?: number;
  priceUnit?: (typeof PRICE_UNITS)[number];
  setups?: Readonly<Record<string, number>>;
  parts?: readonly DemoPart[];
  choices?: readonly DemoChoiceGroup[];
  /** BOOKABLE: default booking length in minutes. */
  durationMinutes?: number;
};

/** Slice 2 of ADR 0025: what the organization configures (`docs/demo-seed.md`). */
export type DemoConfig = {
  listTemplates: readonly VocabularyTemplateKey[];
  lists: readonly { name: string; values: readonly string[] }[];
  setups: readonly { name: string; changeoverMinutes: number }[];
  types: readonly DemoType[];
  venue: { name: string; streetAddress: string; postalCode: string; city: string };
  /** Seeded in the venue. Slice 2 seeds the bookable spaces, slice 3 the rest of the catalog. */
  items: readonly DemoItem[];
  /** Org-specific checks (`docs/demo-seed.md`, Checks), e.g. check 2. */
  checks: { absentLists?: readonly string[]; listSizes?: Readonly<Record<string, number>> };
};
