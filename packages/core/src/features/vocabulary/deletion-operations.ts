import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { vocabularyKind } from "./deletion-kind";
import { getVocabulary } from "./read-operations";
import { VocabularyIdInputSchema } from "./schema";

export const restoreVocabulary = defineRestoreOperation({
  name: "vocabulary.restore",
  description:
    "Restore an archived list: it is active again, with its values. CONFLICT when it is not " +
    "archived or an active list has its name.",
  permission: "configuration:delete",
  kind: vocabularyKind,
  input: VocabularyIdInputSchema,
  get: getVocabulary,
});

export const deleteVocabulary = defineDeleteOperation({
  name: "vocabulary.delete",
  description:
    "Delete an archived list permanently (ADR 0118), with its values. An active list is " +
    "CONFLICT: archive it first. CONFLICT while a field, a requirement, an item demand or an " +
    "active run sheet template uses it.",
  permission: "configuration:delete",
  kind: vocabularyKind,
  input: VocabularyIdInputSchema,
});
