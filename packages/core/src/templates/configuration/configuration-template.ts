import type { EntityBase, ItemBehaviour } from "../../features/entity-type/behaviour-kinds";
import type { FieldKind } from "../../features/field-definition/field-kinds";
import type { VocabularyTemplateKey } from "../vocabularies/vocabulary-templates";

/** A field on a template type. `list` names one of the template's lists (or an existing one). */
export type ConfigurationTemplateField = {
  name: string;
  kind: FieldKind;
  list?: string;
  options?: readonly string[];
};

export type ConfigurationTemplateType = {
  base: EntityBase;
  name: string;
  behaviours?: readonly ItemBehaviour[];
  fields?: readonly ConfigurationTemplateField[];
};

/**
 * A starter configuration an organization can import and then edit freely (ADR 0021): lists,
 * setups, and types with behaviours and fields. Domain words live only in this data.
 */
export type ConfigurationTemplate = {
  key: string;
  /** Display name of the template, e.g. "Conference venue". */
  name: string;
  /** List templates imported as ordinary lists, e.g. `eu-14-allergens`. */
  listTemplates: readonly VocabularyTemplateKey[];
  lists: readonly { name: string; values: readonly string[] }[];
  setups: readonly { name: string; changeoverMinutes: number }[];
  types: readonly ConfigurationTemplateType[];
};
