import {
  archiveFieldDefinition,
  createFieldDefinition,
  type FieldDefinitionDto,
  FieldDefinitionSchema,
  getFieldDefinition,
  getVocabulary,
  listFieldDefinitions,
  updateFieldDefinition,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { VocabularyRef } from "../vocabulary/graphql";

export const FieldDefinitionRef = objectFromSchema<FieldDefinitionDto>({
  name: "FieldDefinition",
  schema: FieldDefinitionSchema,
  omit: ["organizationId"],
  description: "Field – one value staff fill in on items of a type, e.g. Yta m².",
});
const FieldDefinitionPageRef = pageType({ name: "FieldDefinitionPage", item: FieldDefinitionRef });

fieldFromOperation({
  operation: listFieldDefinitions,
  type: FieldDefinitionPageRef,
  name: "fieldDefinitions",
});
fieldFromOperation({
  operation: getFieldDefinition,
  type: FieldDefinitionRef,
  name: "fieldDefinition",
});
mutationFromOperation({ operation: createFieldDefinition, type: FieldDefinitionRef });
mutationFromOperation({ operation: updateFieldDefinition, type: FieldDefinitionRef });
mutationFromOperation({ operation: archiveFieldDefinition, type: FieldDefinitionRef });

// Loaded through the `get` operation so core applies permission (configuration:read) and DTO shape.
builder.objectField(FieldDefinitionRef, "vocabulary", (t) =>
  t.field({
    type: VocabularyRef,
    nullable: true,
    description: "The list the field's choices come from, if any.",
    resolve: (field, _args, ctx) =>
      field.vocabularyId
        ? (runOperation({
            operation: getVocabulary,
            input: { id: field.vocabularyId },
            ctx,
          }) as never)
        : null,
  }),
);
