import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import {
  EntityTypeListWireSchema,
  EntityTypeWireSchema,
  FieldDefinitionListWireSchema,
  FieldDefinitionWireSchema,
  ItemListWireSchema,
  ItemWireSchema,
  SetupListWireSchema,
  SetupWireSchema,
  VocabularyListWireSchema,
  VocabularyWireSchema,
} from "./wire-schemas";

const itemTable = uiEntry({
  component: "item-table",
  schema: ItemListWireSchema,
  toProps: ({ value }) => value,
});
const itemCard = uiEntry({
  component: "item-card",
  schema: ItemWireSchema,
  toProps: ({ value }) => ({ item: value }),
});
const entityTypeTable = uiEntry({
  component: "entity-type-table",
  schema: EntityTypeListWireSchema,
  toProps: ({ value }) => value,
});
const entityTypeCard = uiEntry({
  component: "entity-type-card",
  schema: EntityTypeWireSchema,
  toProps: ({ value }) => ({ entityType: value }),
});
const fieldTable = uiEntry({
  component: "field-definition-table",
  schema: FieldDefinitionListWireSchema,
  toProps: ({ value }) => value,
});
const fieldCard = uiEntry({
  component: "field-definition-card",
  schema: FieldDefinitionWireSchema,
  toProps: ({ value }) => ({ field: value }),
});
const vocabularyTable = uiEntry({
  component: "vocabulary-table",
  schema: VocabularyListWireSchema,
  toProps: ({ value }) => value,
});
const vocabularyCard = uiEntry({
  component: "vocabulary-card",
  schema: VocabularyWireSchema,
  toProps: ({ value }) => ({ vocabulary: value }),
});
const setupTable = uiEntry({
  component: "setup-table",
  schema: SetupListWireSchema,
  toProps: ({ value }) => value,
});
const setupCard = uiEntry({
  component: "setup-card",
  schema: SetupWireSchema,
  toProps: ({ value }) => ({ setup: value }),
});

/** Tool → component for the configurable domain (ADR 0021): items, types, fields, lists, setups. */
export const CONFIGURATION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  item_list: itemTable,
  item_get: itemCard,
  item_create: itemCard,
  item_update: itemCard,
  item_archive: itemCard,
  entityType_list: entityTypeTable,
  entityType_get: entityTypeCard,
  entityType_create: entityTypeCard,
  entityType_update: entityTypeCard,
  entityType_archive: entityTypeCard,
  fieldDefinition_list: fieldTable,
  fieldDefinition_get: fieldCard,
  fieldDefinition_create: fieldCard,
  fieldDefinition_update: fieldCard,
  fieldDefinition_archive: fieldCard,
  vocabulary_list: vocabularyTable,
  vocabulary_get: vocabularyCard,
  vocabulary_create: vocabularyCard,
  vocabulary_update: vocabularyCard,
  vocabulary_archive: vocabularyCard,
  vocabulary_importTemplate: vocabularyCard,
  vocabulary_addValue: vocabularyCard,
  vocabulary_updateValue: vocabularyCard,
  vocabulary_archiveValue: vocabularyCard,
  setup_list: setupTable,
  setup_get: setupCard,
  setup_create: setupCard,
  setup_update: setupCard,
  setup_archive: setupCard,
};
