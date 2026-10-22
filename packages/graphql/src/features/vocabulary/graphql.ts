import {
  addVocabularyValue,
  archiveVocabulary,
  archiveVocabularyValue,
  createVocabulary,
  getVocabulary,
  importVocabularyTemplate,
  listVocabularies,
  updateVocabulary,
  updateVocabularyValue,
  type VocabularyDto,
  VocabularySchema,
  type VocabularyValueDto,
  VocabularyValueSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const VocabularyValueRef = objectFromSchema<VocabularyValueDto>({
  name: "VocabularyValue",
  schema: VocabularyValueSchema,
  description: "One value of a list (vocabulary), e.g. an allergen.",
});

export const VocabularyRef = objectFromSchema<VocabularyDto>({
  name: "Vocabulary",
  schema: VocabularySchema,
  omit: ["organizationId", "values"],
  description: "List – a named set of values that choice fields pick from, e.g. Allergener.",
});
const VocabularyPageRef = pageType({ name: "VocabularyPage", item: VocabularyRef });

builder.objectField(VocabularyRef, "values", (t) =>
  t.field({
    type: [VocabularyValueRef],
    description: "Active values, ordered by position.",
    resolve: (vocabulary) => vocabulary.values,
  }),
);

fieldFromOperation({ operation: listVocabularies, type: VocabularyPageRef, name: "vocabularies" });
fieldFromOperation({ operation: getVocabulary, type: VocabularyRef, name: "vocabulary" });
mutationFromOperation({ operation: createVocabulary, type: VocabularyRef });
mutationFromOperation({ operation: updateVocabulary, type: VocabularyRef });
mutationFromOperation({ operation: archiveVocabulary, type: VocabularyRef });
mutationFromOperation({ operation: importVocabularyTemplate, type: VocabularyRef });
mutationFromOperation({ operation: addVocabularyValue, type: VocabularyRef });
mutationFromOperation({ operation: updateVocabularyValue, type: VocabularyRef });
mutationFromOperation({ operation: archiveVocabularyValue, type: VocabularyRef });
