import { type ConfigurationImportResult, importConfigurationTemplate } from "@okazi/core";
import { builder } from "../../schema/builder";
import { mutationFromOperation } from "../../schema/from-operation";
import { EntityTypeRef } from "../entity-type/graphql";
import { SetupRef } from "../setup/graphql";
import { VocabularyRef } from "../vocabulary/graphql";

type Created = ConfigurationImportResult["created"];
type Skipped = ConfigurationImportResult["skipped"];

const CreatedRef = builder.objectRef<Created>("ConfigurationImportCreated").implement({
  description: "Configuration created by a template import.",
  fields: (t) => ({
    vocabularies: t.field({ type: [VocabularyRef], resolve: (created) => created.vocabularies }),
    setups: t.field({ type: [SetupRef], resolve: (created) => created.setups }),
    entityTypes: t.field({ type: [EntityTypeRef], resolve: (created) => created.entityTypes }),
  }),
});

const SkippedRef = builder.objectRef<Skipped>("ConfigurationImportSkipped").implement({
  description: "Names that already existed and were left untouched.",
  fields: (t) => ({
    vocabularies: t.stringList({ resolve: (skipped) => skipped.vocabularies }),
    setups: t.stringList({ resolve: (skipped) => skipped.setups }),
    entityTypes: t.stringList({ resolve: (skipped) => skipped.entityTypes }),
  }),
});

const ImportRef = builder.objectRef<ConfigurationImportResult>("ConfigurationImport").implement({
  description: "Result of importing a configuration template (lists, setups and types).",
  fields: (t) => ({
    created: t.field({ type: CreatedRef, resolve: (result) => result.created }),
    skipped: t.field({ type: SkippedRef, resolve: (result) => result.skipped }),
  }),
});

mutationFromOperation({ operation: importConfigurationTemplate, type: ImportRef });
